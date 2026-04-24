import { Application, Container } from 'pixi.js';
import { TileMap } from './tileMap';
import { Pawn, TILE_SIZE } from './pawn';
import { renderMap, mapPixelWidth, mapPixelHeight } from './render';
import type { MapData } from '../maps/types';
import { randomName, type Sex } from '../patients/names';

export interface GameInit {
  app: Application;
  mapData: MapData;
  pawnCount?: number;
}

const DEFAULT_PAWN_COLORS = [0xd4a574, 0xb5977a, 0xc89a6b, 0xa88464, 0xd8b088];

export class Game {
  private readonly app: Application;
  readonly map: TileMap;
  readonly world: Container;
  private readonly pawnLayer: Container;
  private readonly pawns: Pawn[] = [];

  constructor(init: GameInit) {
    this.app = init.app;
    this.map = new TileMap(init.mapData);

    this.world = new Container();
    this.app.stage.addChild(this.world);

    this.world.addChild(renderMap(this.map));

    this.pawnLayer = new Container();
    this.world.addChild(this.pawnLayer);

    const count = init.pawnCount ?? 3;
    this.seedPawns(count);

    this.app.ticker.add((ticker) => {
      const dt = Math.min(ticker.deltaMS / 1000, 0.1);
      for (const pawn of this.pawns) {
        pawn.update(dt, this.map, (p) => this.wander(p));
      }
      this.pawnLayer.children.sort((a, b) => a.position.y - b.position.y);
    });

    this.recenter();
    window.addEventListener('resize', () => this.recenter());
  }

  private seedPawns(count: number): void {
    const wardRooms = this.map.rooms.filter((r) => r.type === 'bedroom' || r.type === 'cell');
    for (let i = 0; i < count; i++) {
      const room = wardRooms[i % wardRooms.length];
      const tiles = this.map.walkableTilesInRoom(room.id);
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      const sex: Sex = i % 2 === 0 ? 'male' : 'female';
      const pawn = new Pawn({
        name: randomName(sex),
        sex,
        tileX: tile.x,
        tileY: tile.y,
        color: DEFAULT_PAWN_COLORS[i % DEFAULT_PAWN_COLORS.length],
      });
      this.pawns.push(pawn);
      this.pawnLayer.addChild(pawn.container);
      this.wander(pawn);
    }
  }

  private wander(pawn: Pawn): void {
    const rooms = this.map.rooms;
    for (let attempt = 0; attempt < 10; attempt++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const tiles = this.map.walkableTilesInRoom(room.id);
      if (tiles.length === 0) continue;
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (pawn.setDestination(this.map, tile.x, tile.y)) return;
    }
  }

  private recenter(): void {
    this.world.position.set(
      Math.round((this.app.screen.width - mapPixelWidth(this.map)) / 2),
      Math.round((this.app.screen.height - mapPixelHeight(this.map)) / 2),
    );
  }
}

export { TILE_SIZE };
