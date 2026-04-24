import type { TileMap } from './tileMap';

export interface PathNode {
  x: number;
  y: number;
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function findPath(
  map: TileMap,
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
): PathNode[] | null {
  if (!map.isWalkable(goalX, goalY)) return null;
  if (startX === goalX && startY === goalY) return [];

  const key = (x: number, y: number) => y * map.width + x;

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  const open = new Set<number>();

  const startK = key(startX, startY);
  gScore.set(startK, 0);
  fScore.set(startK, heuristic(startX, startY, goalX, goalY));
  open.add(startK);

  while (open.size > 0) {
    let currentK = -1;
    let currentF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        currentK = k;
      }
    }
    if (currentK === -1) break;

    const cx = currentK % map.width;
    const cy = Math.floor(currentK / map.width);
    if (cx === goalX && cy === goalY) {
      return reconstruct(cameFrom, currentK, map.width);
    }

    open.delete(currentK);
    closed.add(currentK);

    for (const [dx, dy] of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!map.isWalkable(nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;

      const tentativeG = (gScore.get(currentK) ?? Infinity) + 1;
      const knownG = gScore.get(nk) ?? Infinity;
      if (tentativeG < knownG) {
        cameFrom.set(nk, currentK);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic(nx, ny, goalX, goalY));
        open.add(nk);
      }
    }
  }

  return null;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function reconstruct(
  cameFrom: Map<number, number>,
  endK: number,
  width: number,
): PathNode[] {
  const path: PathNode[] = [];
  let k: number | undefined = endK;
  while (k !== undefined) {
    path.push({ x: k % width, y: Math.floor(k / width) });
    k = cameFrom.get(k);
  }
  path.reverse();
  path.shift();
  return path;
}
