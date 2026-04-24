import { Application, Container, Graphics, Text } from 'pixi.js';
import { Button } from './button';
import type { Game } from '../engine/game';
import { GLOBAL_ACTIONS, HIRE_ATTENDANT_COST } from '../engine/actions';

const PANEL_BG = 0x1f1a15;
const PANEL_BORDER = 0x3e3428;
const TEXT = 0xe8e4dc;
const MUTED = 0x9a9086;

const FOOD_COLOR = 0xa85a3a;
const REST_COLOR = 0x5a7390;
const MENTAL_COLOR = 0x8a6ba8;

const PANEL_WIDTH = 220;
const PANEL_HEIGHT = 160;
const PAD = 12;

export class StatsBar {
  readonly container: Container;
  private readonly bg: Graphics;
  private readonly budgetLine: Text;
  private readonly attendantLine: Text;
  private readonly hireButton: Button;

  constructor(
    private readonly app: Application,
    private readonly game: Game,
  ) {
    this.container = new Container();

    this.bg = new Graphics();
    this.container.addChild(this.bg);
    this.drawBg();

    const legend = this.buildLegend();
    legend.position.set(PAD, PAD);
    this.container.addChild(legend);

    this.budgetLine = new Text({
      text: '',
      style: { fill: TEXT, fontSize: 15, fontFamily: 'Georgia, serif' },
    });
    this.budgetLine.position.set(PAD, PAD + 58);
    this.container.addChild(this.budgetLine);

    this.attendantLine = new Text({
      text: '',
      style: { fill: MUTED, fontSize: 13, fontFamily: 'Georgia, serif' },
    });
    this.attendantLine.position.set(PAD, PAD + 82);
    this.container.addChild(this.attendantLine);

    const hireAction = GLOBAL_ACTIONS.find((a) => a.id === 'hire-attendant')!;
    this.hireButton = new Button({
      label: `Hire Attendant ($${HIRE_ATTENDANT_COST})`,
      width: PANEL_WIDTH - PAD * 2,
      height: 26,
      onClick: () => hireAction.apply(game),
    });
    this.hireButton.container.position.set(PAD, PANEL_HEIGHT - 26 - PAD);
    this.container.addChild(this.hireButton.container);

    this.layout();
    this.refresh();
    game.onChange(() => this.refresh());
    window.addEventListener('resize', () => this.layout());
  }

  private layout(): void {
    this.container.position.set(this.app.screen.width - PANEL_WIDTH - 14, 10);
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg
      .roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 6)
      .fill({ color: PANEL_BG, alpha: 0.95 })
      .stroke({ color: PANEL_BORDER, width: 1 });
  }

  private buildLegend(): Container {
    const c = new Container();
    const entries: Array<[string, number]> = [
      ['Food', FOOD_COLOR],
      ['Rest', REST_COLOR],
      ['Mental', MENTAL_COLOR],
    ];
    entries.forEach(([label, color], i) => {
      const swatch = new Graphics()
        .rect(0, 0, 14, 6)
        .fill(color)
        .stroke({ color: 0x000000, width: 1 });
      swatch.position.set(0, i * 18 + 5);
      c.addChild(swatch);
      const text = new Text({
        text: label,
        style: { fill: TEXT, fontSize: 12, fontFamily: 'Georgia, serif' },
      });
      text.position.set(20, i * 18);
      c.addChild(text);
    });
    return c;
  }

  private refresh(): void {
    this.budgetLine.text = `Budget: $${this.game.budget}`;
    this.attendantLine.text = `Attendants: ${this.game.attendants}`;
    const hireAction = GLOBAL_ACTIONS.find((a) => a.id === 'hire-attendant')!;
    this.hireButton.setDisabled(!hireAction.available(this.game));
  }
}
