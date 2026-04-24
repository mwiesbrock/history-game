import { Container, Graphics, Text } from 'pixi.js';
import type { TileMap } from './tileMap';
import { findPath, type PathNode } from './pathfinding';
import type { Sex } from '../patients/names';

export const TILE_SIZE = 32;
const WALK_SPEED = 2.2;
const IDLE_TIME_MIN = 0.8;
const IDLE_TIME_MAX = 2.4;

export interface PawnInit {
  name: string;
  sex: Sex;
  tileX: number;
  tileY: number;
  color: number;
}

export class Pawn {
  readonly name: string;
  readonly sex: Sex;
  readonly container: Container;

  private x: number;
  private y: number;
  private path: PathNode[] = [];
  private idleFor = 0;
  private readonly body: Graphics;
  private readonly label: Text;

  constructor(init: PawnInit) {
    this.name = init.name;
    this.sex = init.sex;
    this.x = init.tileX + 0.5;
    this.y = init.tileY + 0.5;

    this.container = new Container();
    this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);

    this.body = new Graphics()
      .circle(0, 0, 9)
      .fill(init.color)
      .stroke({ color: 0x000000, width: 2 });
    this.container.addChild(this.body);

    this.label = new Text({
      text: init.name,
      style: {
        fill: 0xe8e4dc,
        fontSize: 11,
        fontFamily: 'Georgia, serif',
        stroke: { color: 0x000000, width: 3 },
      },
    });
    this.label.anchor.set(0.5, 1);
    this.label.position.set(0, -12);
    this.container.addChild(this.label);
  }

  get tileX(): number {
    return Math.floor(this.x);
  }

  get tileY(): number {
    return Math.floor(this.y);
  }

  setDestination(map: TileMap, gx: number, gy: number): boolean {
    const path = findPath(map, this.tileX, this.tileY, gx, gy);
    if (!path) return false;
    this.path = path;
    this.idleFor = 0;
    return true;
  }

  update(dt: number, map: TileMap, onArrived: (p: Pawn) => void): void {
    if (this.path.length === 0) {
      this.idleFor -= dt;
      if (this.idleFor <= 0) onArrived(this);
      this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
      return;
    }

    const next = this.path[0];
    const targetX = next.x + 0.5;
    const targetY = next.y + 0.5;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = WALK_SPEED * dt;

    if (dist <= step) {
      this.x = targetX;
      this.y = targetY;
      this.path.shift();
      if (this.path.length === 0) {
        this.idleFor = IDLE_TIME_MIN + Math.random() * (IDLE_TIME_MAX - IDLE_TIME_MIN);
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    // Prevent a stuck pawn from pathfinding into an invalid tile due to map edits.
    if (!map.inBounds(this.tileX, this.tileY)) {
      this.path = [];
    }

    this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
  }
}
