import type { MapData, RoomDef, RoomType } from '../maps/types';

export type TileKind = 'wall' | 'floor' | 'door';

export interface Tile {
  x: number;
  y: number;
  kind: TileKind;
  roomId: string | null;
  roomType: RoomType | null;
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly rooms: ReadonlyArray<RoomDef>;
  private readonly tiles: Tile[];

  constructor(data: MapData) {
    this.width = data.width;
    this.height = data.height;
    this.rooms = data.rooms;

    if (data.tiles.length !== data.height) {
      throw new Error(`Map ${data.id}: expected ${data.height} rows, got ${data.tiles.length}`);
    }

    this.tiles = new Array(this.width * this.height);
    for (let y = 0; y < data.height; y++) {
      const row = data.tiles[y];
      if (row.length !== data.width) {
        throw new Error(
          `Map ${data.id}: row ${y} has width ${row.length}, expected ${data.width}`,
        );
      }
      for (let x = 0; x < data.width; x++) {
        const ch = row[x];
        const kind = charToKind(ch, data.id, x, y);
        const room = findRoom(data.rooms, x, y);
        this.tiles[y * this.width + x] = {
          x,
          y,
          kind,
          roomId: room?.id ?? null,
          roomType: room?.type ?? null,
        };
      }
    }
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): Tile {
    if (!this.inBounds(x, y)) {
      throw new Error(`Tile out of bounds: (${x}, ${y})`);
    }
    return this.tiles[y * this.width + x];
  }

  isWalkable(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const t = this.tiles[y * this.width + x];
    return t.kind === 'floor' || t.kind === 'door';
  }

  walkableTilesInRoom(roomId: string): Tile[] {
    const result: Tile[] = [];
    for (const t of this.tiles) {
      if (t.roomId === roomId && (t.kind === 'floor' || t.kind === 'door')) {
        result.push(t);
      }
    }
    return result;
  }

  allTiles(): ReadonlyArray<Tile> {
    return this.tiles;
  }
}

function charToKind(ch: string, mapId: string, x: number, y: number): TileKind {
  switch (ch) {
    case '#':
      return 'wall';
    case '.':
      return 'floor';
    case 'D':
      return 'door';
    default:
      throw new Error(`Map ${mapId}: unknown tile '${ch}' at (${x}, ${y})`);
  }
}

function findRoom(rooms: RoomDef[], x: number, y: number): RoomDef | undefined {
  return rooms.find(
    (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
  );
}
