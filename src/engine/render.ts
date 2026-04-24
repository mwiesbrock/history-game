import { Container, Graphics, Text } from 'pixi.js';
import type { TileMap } from './tileMap';
import { TILE_SIZE } from './pawn';
import type { RoomType } from '../maps/types';

const WALL_COLOR = 0x2a241d;
const DOOR_COLOR = 0x6b4a2e;

const FLOOR_COLORS: Record<RoomType, readonly [number, number]> = {
  bedroom: [0x5a4a38, 0x4f4032],
  cell: [0x2d2620, 0x352d26],
  corridor: [0x3f3830, 0x443c33],
  kitchen: [0x5c4636, 0x513e2f],
  dining: [0x5c4636, 0x513e2f],
  garden: [0x3d5530, 0x435c34],
  office: [0x4a4038, 0x423730],
};
const UNROOMED_FLOOR: readonly [number, number] = [0x3a332b, 0x403830];

export function renderMap(map: TileMap): Container {
  const container = new Container();

  const floor = new Graphics();
  for (const tile of map.allTiles()) {
    if (tile.kind === 'wall') continue;
    const palette = tile.roomType ? FLOOR_COLORS[tile.roomType] : UNROOMED_FLOOR;
    const shade = palette[(tile.x + tile.y) & 1];
    floor.rect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill(shade);
  }
  container.addChild(floor);

  const doors = new Graphics();
  for (const tile of map.allTiles()) {
    if (tile.kind !== 'door') continue;
    const pad = 6;
    doors
      .rect(
        tile.x * TILE_SIZE + pad,
        tile.y * TILE_SIZE + pad,
        TILE_SIZE - pad * 2,
        TILE_SIZE - pad * 2,
      )
      .fill(DOOR_COLOR)
      .stroke({ color: 0x3a2718, width: 1 });
  }
  container.addChild(doors);

  const walls = new Graphics();
  for (const tile of map.allTiles()) {
    if (tile.kind !== 'wall') continue;
    walls.rect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill(WALL_COLOR);
  }
  container.addChild(walls);

  const labels = new Container();
  for (const room of map.rooms) {
    const text = new Text({
      text: room.label,
      style: {
        fill: 0x8a7f72,
        fontSize: 13,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
      },
    });
    text.anchor.set(0.5);
    text.position.set(
      (room.x + room.w / 2) * TILE_SIZE,
      (room.y + room.h / 2) * TILE_SIZE,
    );
    text.alpha = 0.55;
    labels.addChild(text);
  }
  container.addChild(labels);

  return container;
}

export function mapPixelWidth(map: TileMap): number {
  return map.width * TILE_SIZE;
}

export function mapPixelHeight(map: TileMap): number {
  return map.height * TILE_SIZE;
}
