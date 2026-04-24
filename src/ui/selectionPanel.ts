import { Application, Container, Graphics, Text } from 'pixi.js';
import { Button } from './button';
import type { Game } from '../engine/game';
import { PAWN_ACTIONS, type PawnAction } from '../engine/actions';

const PANEL_BG = 0x1f1a15;
const PANEL_BORDER = 0x3e3428;
const TEXT = 0xe8e4dc;
const MUTED = 0x9a9086;
const AGITATED_TEXT = 0xd88070;
const RESTRAINED_TEXT = 0xb59070;

const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 130;
const PANEL_PAD = 14;

export class SelectionPanel {
  readonly container: Container;
  private readonly bg: Graphics;
  private readonly name: Text;
  private readonly condition: Text;
  private readonly needsLine: Text;
  private readonly assignmentLine: Text;
  private readonly hint: Text;
  private readonly buttonRow: Container;
  private readonly buttons = new Map<string, Button>();

  constructor(
    private readonly app: Application,
    private readonly game: Game,
  ) {
    this.container = new Container();

    this.bg = new Graphics();
    this.container.addChild(this.bg);
    this.drawBg();

    this.name = new Text({
      text: '',
      style: { fill: TEXT, fontSize: 18, fontFamily: 'Georgia, serif' },
    });
    this.name.position.set(PANEL_PAD, PANEL_PAD);
    this.container.addChild(this.name);

    this.condition = new Text({
      text: '',
      style: {
        fill: MUTED,
        fontSize: 13,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
      },
    });
    this.condition.position.set(PANEL_PAD, PANEL_PAD + 26);
    this.container.addChild(this.condition);

    this.needsLine = new Text({
      text: '',
      style: { fill: MUTED, fontSize: 12, fontFamily: 'Georgia, serif' },
    });
    this.needsLine.position.set(PANEL_PAD, PANEL_PAD + 48);
    this.container.addChild(this.needsLine);

    this.assignmentLine = new Text({
      text: '',
      style: { fill: MUTED, fontSize: 12, fontFamily: 'Georgia, serif' },
    });
    this.assignmentLine.position.set(PANEL_PAD, PANEL_PAD + 66);
    this.container.addChild(this.assignmentLine);

    this.hint = new Text({
      text: 'Click a patient to select them.',
      style: {
        fill: MUTED,
        fontSize: 14,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
      },
    });
    this.hint.anchor.set(0.5);
    this.hint.position.set(PANEL_WIDTH / 2, PANEL_HEIGHT / 2);
    this.container.addChild(this.hint);

    this.buttonRow = new Container();
    this.buttonRow.position.set(PANEL_PAD, PANEL_HEIGHT - 32);
    this.container.addChild(this.buttonRow);

    this.layout();
    this.refresh();
    game.onChange(() => this.refresh());
    window.addEventListener('resize', () => this.layout());
  }

  private layout(): void {
    const x = Math.round((this.app.screen.width - PANEL_WIDTH) / 2);
    const y = this.app.screen.height - PANEL_HEIGHT - 14;
    this.container.position.set(x, y);
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg
      .roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 6)
      .fill({ color: PANEL_BG, alpha: 0.95 })
      .stroke({ color: PANEL_BORDER, width: 1 });
  }

  private refresh(): void {
    const sel = this.game.selected;
    const hasSelection = sel !== null;

    this.hint.visible = !hasSelection;
    this.name.visible = hasSelection;
    this.condition.visible = hasSelection;
    this.needsLine.visible = hasSelection;
    this.assignmentLine.visible = hasSelection;
    this.buttonRow.visible = hasSelection;

    if (!sel) {
      this.buttonRow.removeChildren();
      this.buttons.clear();
      return;
    }

    this.name.text = sel.name;

    const conditions: Array<[string, number]> = [];
    if (sel.restrained) conditions.push(['Restrained in chains', RESTRAINED_TEXT]);
    if (sel.agitated) conditions.push(['Agitated', AGITATED_TEXT]);
    if (conditions.length === 0) {
      this.condition.text = 'Calm';
      this.condition.style.fill = MUTED;
    } else {
      this.condition.text = conditions.map(([t]) => t).join(' · ');
      this.condition.style.fill = conditions[0][1];
    }

    this.needsLine.text = `Food ${Math.round(sel.needs.food)}   Rest ${Math.round(
      sel.needs.rest,
    )}   Mental ${Math.round(sel.needs.mental)}`;

    const room = sel.assignedRoom ? this.game.roomById(sel.assignedRoom) : null;
    this.assignmentLine.text = room
      ? `Assigned to: ${room.label}`
      : 'No assignment (roams freely)';

    this.syncButtons(sel);
  }

  private syncButtons(sel: NonNullable<Game['selected']>): void {
    const visibleActions: PawnAction[] = PAWN_ACTIONS.filter((a) =>
      !(a.id === 'unchain' && !sel.restrained)
      && !(a.id === 'release-assignment' && sel.assignedRoom === null),
    );

    while (this.buttonRow.children.length < visibleActions.length) {
      const idx = this.buttonRow.children.length;
      const btn = new Button({
        label: '',
        width: 120,
        height: 26,
        onClick: () => {
          const action = this.currentVisibleActions[idx];
          const s = this.game.selected;
          if (!action || !s) return;
          action.apply(this.game, s);
        },
      });
      btn.container.position.set(idx * 128, 0);
      this.buttonRow.addChild(btn.container);
      this.buttons.set(String(idx), btn);
    }
    while (this.buttonRow.children.length > visibleActions.length) {
      const removed = this.buttonRow.children.pop()!;
      removed.destroy({ children: true });
      this.buttons.delete(String(this.buttonRow.children.length));
    }

    this.currentVisibleActions = visibleActions;
    visibleActions.forEach((action, idx) => {
      const btn = this.buttons.get(String(idx));
      if (!btn) return;
      const label = action.cost > 0 ? `${action.label} ($${action.cost})` : action.label;
      btn.setLabel(label);
      btn.setDisabled(!action.available(this.game, sel));
    });
  }

  private currentVisibleActions: PawnAction[] = [];
}
