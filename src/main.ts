import { Application, Container, Graphics, Text } from 'pixi.js';
import almshouse from './scenarios/almshouse-1841.json';
import type { Scenario } from './scenarios/types';

const TILE = 32;
const GRID_W = 40;
const GRID_H = 24;

const WALL_COLOR = 0x2a241d;
const FLOOR_A = 0x4a4037;
const FLOOR_B = 0x524840;
const PAWN_COLOR = 0xd4a574;

async function boot() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const app = new Application();
  await app.init({
    canvas,
    resizeTo: window,
    background: '#1a1814',
    antialias: false,
    roundPixels: true,
  });

  const scenario = almshouse as Scenario;

  const world = new Container();
  app.stage.addChild(world);

  drawFloor(world);
  drawWalls(world);

  const pawn = new Graphics()
    .circle(0, 0, 9)
    .fill(PAWN_COLOR)
    .stroke({ color: 0x000000, width: 2 });
  pawn.position.set((GRID_W * TILE) / 2, (GRID_H * TILE) / 2);
  world.addChild(pawn);

  const hud = new Container();
  app.stage.addChild(hud);

  const title = new Text({
    text: `${scenario.title} — ${scenario.year}`,
    style: { fill: 0xe8e4dc, fontSize: 20, fontFamily: 'Georgia, serif' },
  });
  title.position.set(14, 10);
  hud.addChild(title);

  const subtitle = new Text({
    text: 'M1 scaffold — engine alive',
    style: { fill: 0x9a9086, fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic' },
  });
  subtitle.position.set(14, 36);
  hud.addChild(subtitle);

  const recenter = () => {
    world.position.set(
      Math.round((app.screen.width - GRID_W * TILE) / 2),
      Math.round((app.screen.height - GRID_H * TILE) / 2),
    );
  };
  recenter();
  window.addEventListener('resize', recenter);

  let t = 0;
  app.ticker.add((ticker) => {
    t += ticker.deltaMS / 1000;
    pawn.position.x = (GRID_W * TILE) / 2 + Math.cos(t * 0.6) * 60;
    pawn.position.y = (GRID_H * TILE) / 2 + Math.sin(t * 0.45) * 40;
  });
}

function drawFloor(parent: Container) {
  const g = new Graphics();
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const shade = ((x + y) & 1) === 0 ? FLOOR_A : FLOOR_B;
      g.rect(x * TILE, y * TILE, TILE, TILE).fill(shade);
    }
  }
  parent.addChild(g);
}

function drawWalls(parent: Container) {
  const g = new Graphics();
  const wallTile = (x: number, y: number) =>
    g.rect(x * TILE, y * TILE, TILE, TILE).fill(WALL_COLOR);

  for (let x = 0; x < GRID_W; x++) {
    wallTile(x, 0);
    wallTile(x, GRID_H - 1);
  }
  for (let y = 0; y < GRID_H; y++) {
    wallTile(0, y);
    wallTile(GRID_W - 1, y);
  }

  const divX = Math.floor(GRID_W / 2);
  for (let y = 1; y < GRID_H - 1; y++) {
    if (y === Math.floor(GRID_H / 2)) continue;
    wallTile(divX, y);
  }

  const divY = Math.floor(GRID_H / 3);
  for (let x = 1; x < divX; x++) {
    if (x === Math.floor(divX / 2)) continue;
    wallTile(x, divY);
  }

  parent.addChild(g);
}

boot().catch((err) => {
  console.error('Failed to boot:', err);
  document.body.innerHTML = `<pre style="color:#e8e4dc;padding:20px">Boot error: ${String(err)}</pre>`;
});
