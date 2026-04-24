export type RoomType =
  | 'bedroom'
  | 'cell'
  | 'corridor'
  | 'kitchen'
  | 'dining'
  | 'garden'
  | 'office';

export interface RoomDef {
  id: string;
  type: RoomType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapData {
  id: string;
  width: number;
  height: number;
  tiles: string[];
  rooms: RoomDef[];
}
