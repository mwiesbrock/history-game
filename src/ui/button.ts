import { Container, Graphics, Text } from 'pixi.js';

const BG_NORMAL = 0x3e3428;
const BG_HOVER = 0x4e4238;
const BG_DISABLED = 0x24201b;
const BORDER = 0x6b5b3e;
const TEXT_NORMAL = 0xe8e4dc;
const TEXT_DISABLED = 0x6a635a;

export interface ButtonOpts {
  label: string;
  width?: number;
  height?: number;
  onClick: () => void;
}

export class Button {
  readonly container: Container;
  private readonly bg: Graphics;
  private readonly text: Text;
  private readonly onClick: () => void;
  private _disabled = false;
  private _hovered = false;
  private readonly width: number;
  private readonly height: number;

  constructor(opts: ButtonOpts) {
    this.width = opts.width ?? 160;
    this.height = opts.height ?? 26;
    this.onClick = opts.onClick;

    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.bg = new Graphics();
    this.container.addChild(this.bg);

    this.text = new Text({
      text: opts.label,
      style: {
        fill: TEXT_NORMAL,
        fontSize: 13,
        fontFamily: 'Georgia, serif',
      },
    });
    this.text.anchor.set(0.5);
    this.text.position.set(this.width / 2, this.height / 2);
    this.container.addChild(this.text);

    this.container.on('pointerover', () => {
      this._hovered = true;
      this.redraw();
    });
    this.container.on('pointerout', () => {
      this._hovered = false;
      this.redraw();
    });
    this.container.on('pointertap', () => {
      if (!this._disabled) this.onClick();
    });

    this.redraw();
  }

  setDisabled(disabled: boolean): void {
    if (this._disabled === disabled) return;
    this._disabled = disabled;
    this.container.eventMode = disabled ? 'none' : 'static';
    this.container.cursor = disabled ? 'default' : 'pointer';
    this.redraw();
  }

  setLabel(label: string): void {
    if (this.text.text !== label) this.text.text = label;
  }

  private redraw(): void {
    const bgColor = this._disabled
      ? BG_DISABLED
      : this._hovered
        ? BG_HOVER
        : BG_NORMAL;
    this.bg.clear();
    this.bg
      .roundRect(0, 0, this.width, this.height, 3)
      .fill(bgColor)
      .stroke({ color: BORDER, width: 1 });
    this.text.style.fill = this._disabled ? TEXT_DISABLED : TEXT_NORMAL;
  }
}
