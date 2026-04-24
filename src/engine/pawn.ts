import { Container, Graphics, Text } from 'pixi.js';
import type { TileMap } from './tileMap';
import { findPath, type PathNode } from './pathfinding';
import type { Sex } from '../patients/names';
import type { RoomType } from '../maps/types';
import { makeNeeds, tickNeedsForPawn, NEED_MAX, type Needs, type NeedContext } from './needs';

export const TILE_SIZE = 48;
const WALK_SPEED = 1.3;
const IDLE_TIME_MIN = 2.0;
const IDLE_TIME_MAX = 5.0;

const BAR_W = 34;
const BAR_H = 4;
const BAR_GAP = 1;
const BAR_BG = 0x1a1410;
const FOOD_COLOR = 0xa85a3a;
const REST_COLOR = 0x5a7390;
const MENTAL_COLOR = 0x8a6ba8;

const OUTLINE = 0x1a1410;
const RESTRAINT_COLOR = 0x8a6a3a;
const AGITATION_COLOR = 0xc24a3a;
const SELECTION_RING_COLOR = 0xf0d690;

let nextId = 1;

export interface PawnInit {
  name: string;
  sex: Sex;
  tileX: number;
  tileY: number;
  shirtColor: number;
  skinColor: number;
  hairColor: number;
  restrained?: boolean;
  agitated?: boolean;
}

export class Pawn {
  readonly id: number;
  readonly name: string;
  readonly sex: Sex;
  readonly container: Container;
  readonly needs: Needs;

  restrained: boolean;
  agitated: boolean;
  assignedRoom: string | null = null;

  private x: number;
  private y: number;
  private path: PathNode[] = [];
  private idleFor = 0;
  private readonly body: Graphics;
  private readonly label: Text;
  private readonly bars: Graphics;
  private readonly statusMarks: Graphics;
  private readonly selectionRing: Graphics;

  constructor(init: PawnInit) {
    this.id = nextId++;
    this.name = init.name;
    this.sex = init.sex;
    this.x = init.tileX + 0.5;
    this.y = init.tileY + 0.5;
    this.needs = makeNeeds();
    this.restrained = init.restrained ?? false;
    this.agitated = init.agitated ?? false;

    this.container = new Container();
    this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = {
      contains: (px: number, py: number) => px >= -18 && px <= 18 && py >= -22 && py <= 14,
    };

    this.selectionRing = new Graphics();
    this.selectionRing.visible = false;
    this.container.addChild(this.selectionRing);

    this.body = buildBody(init.shirtColor, init.skinColor, init.hairColor);
    this.container.addChild(this.body);

    this.statusMarks = new Graphics();
    this.container.addChild(this.statusMarks);
    this.redrawStatusMarks();

    this.bars = new Graphics();
    this.container.addChild(this.bars);

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
    this.label.position.set(0, -32);
    this.container.addChild(this.label);

    this.redrawBars();
  }

  get tileX(): number {
    return Math.floor(this.x);
  }

  get tileY(): number {
    return Math.floor(this.y);
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.selectionRing.clear();
      this.selectionRing.ellipse(0, 2, 14, 7).stroke({ color: SELECTION_RING_COLOR, width: 2 });
      this.selectionRing.visible = true;
    } else {
      this.selectionRing.visible = false;
    }
  }

  setRestrained(restrained: boolean): void {
    this.restrained = restrained;
    if (restrained) this.path = [];
    this.redrawStatusMarks();
  }

  setAgitated(agitated: boolean): void {
    this.agitated = agitated;
    this.redrawStatusMarks();
  }

  applyBoost(food: number, rest: number, mental: number): void {
    this.needs.food = clamp(this.needs.food + food);
    this.needs.rest = clamp(this.needs.rest + rest);
    this.needs.mental = clamp(this.needs.mental + mental);
    this.redrawBars();
  }

  setDestination(map: TileMap, gx: number, gy: number): boolean {
    if (this.restrained) return false;
    const path = findPath(map, this.tileX, this.tileY, gx, gy);
    if (!path) return false;
    this.path = path;
    this.idleFor = 0;
    return true;
  }

  tickNeeds(dayFraction: number, roomType: RoomType | null, ctx: NeedContext): void {
    tickNeedsForPawn(this.needs, dayFraction, roomType, {
      ...ctx,
      restrained: this.restrained,
      agitated: this.agitated,
    });
    if (this.needs.mental < 30 && !this.agitated && Math.random() < dayFraction * 3) {
      this.setAgitated(true);
    }
    if (this.needs.mental > 65 && this.agitated && Math.random() < dayFraction * 2) {
      this.setAgitated(false);
    }
    this.redrawBars();
  }

  update(dt: number, map: TileMap, onArrived: (p: Pawn) => void): void {
    if (this.restrained) {
      this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
      return;
    }

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

    if (!map.inBounds(this.tileX, this.tileY)) {
      this.path = [];
    }

    this.container.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
  }

  private redrawBars(): void {
    this.bars.clear();
    const x0 = -BAR_W / 2;
    const topY = -30;
    drawBar(this.bars, x0, topY, this.needs.food, FOOD_COLOR);
    drawBar(this.bars, x0, topY + BAR_H + BAR_GAP, this.needs.rest, REST_COLOR);
    drawBar(this.bars, x0, topY + (BAR_H + BAR_GAP) * 2, this.needs.mental, MENTAL_COLOR);
  }

  private redrawStatusMarks(): void {
    this.statusMarks.clear();
    if (this.restrained) {
      this.statusMarks
        .rect(-9, 4, 18, 2)
        .fill(RESTRAINT_COLOR)
        .stroke({ color: OUTLINE, width: 1 });
      this.statusMarks.rect(-10, 5, 2, 4).fill(RESTRAINT_COLOR);
      this.statusMarks.rect(8, 5, 2, 4).fill(RESTRAINT_COLOR);
    }
    if (this.agitated) {
      this.statusMarks
        .circle(8, -14, 3)
        .fill(AGITATION_COLOR)
        .stroke({ color: OUTLINE, width: 1 });
    }
  }
}

function drawBar(g: Graphics, x: number, y: number, value: number, color: number): void {
  g.rect(x, y, BAR_W, BAR_H).fill(BAR_BG);
  const w = (Math.max(0, Math.min(NEED_MAX, value)) / NEED_MAX) * BAR_W;
  if (w > 0) g.rect(x, y, w, BAR_H).fill(color);
}

function buildBody(shirtColor: number, skinColor: number, hairColor: number): Graphics {
  const g = new Graphics();
  g.rect(-8, -3, 3, 8).fill(shirtColor).stroke({ color: OUTLINE, width: 1 });
  g.rect(5, -3, 3, 8).fill(shirtColor).stroke({ color: OUTLINE, width: 1 });
  g.roundRect(-6, -4, 12, 11, 2).fill(shirtColor).stroke({ color: OUTLINE, width: 1 });
  g.circle(0, -10, 5).fill(skinColor).stroke({ color: OUTLINE, width: 1 });
  g.circle(0, -12, 4).fill(hairColor);
  g.rect(-4, -10, 8, 2).fill(hairColor);
  return g;
}

function clamp(v: number): number {
  if (v < 0) return 0;
  if (v > NEED_MAX) return NEED_MAX;
  return v;
}
