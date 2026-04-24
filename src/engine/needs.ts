import type { RoomType } from '../maps/types';

export interface Needs {
  food: number;
  rest: number;
  mental: number;
}

export interface NeedContext {
  attendants: number;
  restrained: boolean;
  agitated: boolean;
}

export const NEED_MAX = 100;

export const FOOD_DECAY_PER_DAY = 40;
export const REST_DECAY_PER_DAY = 55;
export const MENTAL_DECAY_PER_DAY_BASE = 6;

export const LOW_NEED_THRESHOLD = 25;
export const LOW_NEED_MENTAL_PENALTY_PER_DAY = 12;

export const RESTRAINED_MENTAL_PENALTY_PER_DAY = 12;
export const AGITATED_MENTAL_PENALTY_PER_DAY = 5;
export const ATTENDANT_MENTAL_BONUS_PER_DAY = 2;

export const ROOM_MENTAL_DELTA_PER_DAY: Partial<Record<RoomType, number>> = {
  bedroom: 2,
  corridor: -1,
  cell: -18,
  kitchen: 0,
  dining: 3,
  garden: 10,
  office: 0,
};

export function makeNeeds(init?: Partial<Needs>): Needs {
  return {
    food: init?.food ?? NEED_MAX,
    rest: init?.rest ?? NEED_MAX,
    mental: init?.mental ?? NEED_MAX,
  };
}

export function tickNeedsForPawn(
  needs: Needs,
  dayFraction: number,
  roomType: RoomType | null,
  ctx: NeedContext,
): void {
  needs.food = clamp(needs.food - FOOD_DECAY_PER_DAY * dayFraction);
  needs.rest = clamp(needs.rest - REST_DECAY_PER_DAY * dayFraction);

  let mentalDelta = -MENTAL_DECAY_PER_DAY_BASE;
  if (roomType) {
    mentalDelta += ROOM_MENTAL_DELTA_PER_DAY[roomType] ?? 0;
  }
  if (needs.food < LOW_NEED_THRESHOLD) mentalDelta -= LOW_NEED_MENTAL_PENALTY_PER_DAY;
  if (needs.rest < LOW_NEED_THRESHOLD) mentalDelta -= LOW_NEED_MENTAL_PENALTY_PER_DAY;
  if (ctx.restrained) mentalDelta -= RESTRAINED_MENTAL_PENALTY_PER_DAY;
  if (ctx.agitated) mentalDelta -= AGITATED_MENTAL_PENALTY_PER_DAY;
  mentalDelta += ctx.attendants * ATTENDANT_MENTAL_BONUS_PER_DAY;

  needs.mental = clamp(needs.mental + mentalDelta * dayFraction);
}

function clamp(v: number): number {
  if (v < 0) return 0;
  if (v > NEED_MAX) return NEED_MAX;
  return v;
}
