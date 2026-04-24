import type { Game } from './game';
import type { Pawn } from './pawn';

export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export interface PawnAction {
  id: string;
  label: string;
  cost: number;
  available: (game: Game, pawn: Pawn) => boolean;
  apply: (game: Game, pawn: Pawn) => ActionResult;
}

export interface GlobalAction {
  id: string;
  label: string;
  cost: number;
  available: (game: Game) => boolean;
  apply: (game: Game) => ActionResult;
}

export const UNCHAIN_COST = 5;
export const FEED_BATHE_COST = 3;
export const HIRE_ATTENDANT_COST = 40;

export const PAWN_ACTIONS: PawnAction[] = [
  {
    id: 'unchain',
    label: 'Unchain',
    cost: UNCHAIN_COST,
    available: (g, p) => p.restrained && g.budget >= UNCHAIN_COST,
    apply: (g, p) =>
      g.unchain(p, UNCHAIN_COST)
        ? { ok: true }
        : { ok: false, reason: 'Cannot unchain.' },
  },
  {
    id: 'feed-bathe',
    label: 'Feed & Bathe',
    cost: FEED_BATHE_COST,
    available: (g) => g.budget >= FEED_BATHE_COST,
    apply: (g, p) =>
      g.feedAndBathe(p, FEED_BATHE_COST)
        ? { ok: true }
        : { ok: false, reason: 'Not enough funds.' },
  },
  {
    id: 'send-garden',
    label: 'Send to Garden',
    cost: 0,
    available: (g, p) =>
      !p.restrained && !!g.roomById('garden') && p.assignedRoom !== 'garden',
    apply: (g, p) => {
      g.assignToRoom(p, 'garden');
      return { ok: true };
    },
  },
  {
    id: 'isolate',
    label: 'Isolate (Cell)',
    cost: 0,
    available: (g, p) =>
      !p.restrained && !!g.roomById('restraints-cell') && p.assignedRoom !== 'restraints-cell',
    apply: (g, p) => {
      g.assignToRoom(p, 'restraints-cell');
      return { ok: true };
    },
  },
  {
    id: 'release-assignment',
    label: 'Let Roam',
    cost: 0,
    available: (_g, p) => !p.restrained && p.assignedRoom !== null,
    apply: (g, p) => {
      g.assignToRoom(p, null);
      return { ok: true };
    },
  },
];

export const GLOBAL_ACTIONS: GlobalAction[] = [
  {
    id: 'hire-attendant',
    label: 'Hire Trained Attendant',
    cost: HIRE_ATTENDANT_COST,
    available: (g) => g.budget >= HIRE_ATTENDANT_COST,
    apply: (g) =>
      g.hireAttendant(HIRE_ATTENDANT_COST)
        ? { ok: true }
        : { ok: false, reason: 'Not enough funds.' },
  },
];
