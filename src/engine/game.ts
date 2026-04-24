import { Application, Container, FederatedPointerEvent } from 'pixi.js';
import { TileMap } from './tileMap';
import { Pawn, TILE_SIZE } from './pawn';
import { renderMap, mapPixelWidth, mapPixelHeight } from './render';
import type { MapData, RoomDef } from '../maps/types';
import { randomName, type Sex } from '../patients/names';
import { Clock, SECONDS_PER_DAY } from './clock';

export interface GameInit {
  app: Application;
  mapData: MapData;
  durationDays: number;
  startingBudget: number;
  pawnCount?: number;
}

const SHIRT_COLORS = [0x6b5b3e, 0x4a6370, 0x7a5a3e, 0x5a5a4a, 0x3e4a5a, 0x8a7a5e, 0x5e4a3e];
const SKIN_COLORS = [0xe0c4a4, 0xd4b088, 0xc9a683, 0xb08968, 0x9e7a58];
const HAIR_COLORS = [0x2a1a10, 0x4e2f1a, 0x6b4226, 0x3e2a1c, 0x7a6a55, 0x5a4a40, 0x1f1815];

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type GameListener = () => void;

export class Game {
  private readonly app: Application;
  readonly map: TileMap;
  readonly world: Container;
  readonly clock: Clock;
  private readonly pawnLayer: Container;
  private readonly pawns: Pawn[] = [];

  private _budget: number;
  private _attendants = 0;
  private _selected: Pawn | null = null;
  private readonly listeners = new Set<GameListener>();

  constructor(init: GameInit) {
    this.app = init.app;
    this.map = new TileMap(init.mapData);
    this.clock = new Clock(init.durationDays);
    this._budget = init.startingBudget;

    this.world = new Container();
    this.world.eventMode = 'static';
    this.app.stage.addChild(this.world);

    this.world.addChild(renderMap(this.map));

    this.pawnLayer = new Container();
    this.world.addChild(this.pawnLayer);

    const count = init.pawnCount ?? 3;
    this.seedPawns(count);

    this.world.on('pointerdown', (e: FederatedPointerEvent) => this.handleWorldClick(e));

    this.app.ticker.add((ticker) => {
      const dt = Math.min(ticker.deltaMS / 1000, 0.1);
      this.clock.tick(dt);

      const dayFraction = dt / SECONDS_PER_DAY;
      const clockActive = !this.clock.paused && !this.clock.ended;

      for (const pawn of this.pawns) {
        pawn.update(dt, this.map, (p) => this.wander(p));
        if (clockActive) {
          const tile = this.map.get(pawn.tileX, pawn.tileY);
          pawn.tickNeeds(dayFraction, tile.roomType, {
            attendants: this._attendants,
            restrained: pawn.restrained,
            agitated: pawn.agitated,
          });
        }
      }
      this.pawnLayer.children.sort((a, b) => a.position.y - b.position.y);
      if (clockActive) this.emitChange();
    });

    this.recenter();
    window.addEventListener('resize', () => this.recenter());
  }

  get pawnList(): ReadonlyArray<Pawn> {
    return this.pawns;
  }

  get budget(): number {
    return this._budget;
  }

  get attendants(): number {
    return this._attendants;
  }

  get selected(): Pawn | null {
    return this._selected;
  }

  onChange(fn: GameListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  select(pawn: Pawn | null): void {
    if (this._selected === pawn) return;
    this._selected?.setSelected(false);
    this._selected = pawn;
    this._selected?.setSelected(true);
    this.emitChange();
  }

  hireAttendant(cost: number): boolean {
    if (this._budget < cost) return false;
    this._budget -= cost;
    this._attendants += 1;
    this.emitChange();
    return true;
  }

  unchain(pawn: Pawn, cost: number): boolean {
    if (!pawn.restrained) return false;
    if (this._budget < cost) return false;
    this._budget -= cost;
    pawn.setRestrained(false);
    this.emitChange();
    return true;
  }

  feedAndBathe(pawn: Pawn, cost: number): boolean {
    if (this._budget < cost) return false;
    this._budget -= cost;
    pawn.applyBoost(70, 55, 10);
    this.emitChange();
    return true;
  }

  assignToRoom(pawn: Pawn, roomId: string | null): void {
    if (pawn.restrained) return;
    pawn.assignedRoom = roomId;
    this.wander(pawn);
    this.emitChange();
  }

  roomById(id: string): RoomDef | undefined {
    return this.map.rooms.find((r) => r.id === id);
  }

  private handleWorldClick(e: FederatedPointerEvent): void {
    const hit = e.target;
    for (const pawn of this.pawns) {
      if (hit === pawn.container || pawn.container.children.includes(hit as never)) {
        this.select(pawn);
        return;
      }
    }
    this.select(null);
  }

  private seedPawns(count: number): void {
    const initialConditions: Array<{ room: string; restrained: boolean; agitated: boolean }> = [
      { room: 'restraints-cell', restrained: true, agitated: true },
      { room: 'restraints-cell', restrained: true, agitated: false },
      { room: 'womens-ward', restrained: false, agitated: false },
      { room: 'mens-ward', restrained: false, agitated: true },
      { room: 'womens-ward', restrained: false, agitated: false },
      { room: 'mens-ward', restrained: false, agitated: false },
      { room: 'mens-ward', restrained: false, agitated: false },
    ];

    for (let i = 0; i < count; i++) {
      const cond = initialConditions[i % initialConditions.length];
      const room = this.map.rooms.find((r) => r.id === cond.room) ?? this.map.rooms[0];
      const tiles = this.map.walkableTilesInRoom(room.id);
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      const sex: Sex = Math.random() < 0.5 ? 'male' : 'female';
      const pawn = new Pawn({
        name: randomName(sex),
        sex,
        tileX: tile.x,
        tileY: tile.y,
        shirtColor: pick(SHIRT_COLORS),
        skinColor: pick(SKIN_COLORS),
        hairColor: pick(HAIR_COLORS),
        restrained: cond.restrained,
        agitated: cond.agitated,
      });
      this.pawns.push(pawn);
      this.pawnLayer.addChild(pawn.container);
      if (!cond.restrained) this.wander(pawn);
    }
  }

  private wander(pawn: Pawn): void {
    if (pawn.restrained) return;
    const rooms = pawn.assignedRoom
      ? this.map.rooms.filter((r) => r.id === pawn.assignedRoom)
      : this.map.rooms;
    for (let attempt = 0; attempt < 10; attempt++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const tiles = this.map.walkableTilesInRoom(room.id);
      if (tiles.length === 0) continue;
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (pawn.setDestination(this.map, tile.x, tile.y)) return;
    }
  }

  private emitChange(): void {
    for (const fn of this.listeners) fn();
  }

  private recenter(): void {
    this.world.position.set(
      Math.round((this.app.screen.width - mapPixelWidth(this.map)) / 2),
      Math.round((this.app.screen.height - mapPixelHeight(this.map)) / 2),
    );
  }
}

export { TILE_SIZE };
