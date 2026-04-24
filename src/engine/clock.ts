export const SECONDS_PER_DAY = 30;

export class Clock {
  private elapsed = 0;
  readonly durationDays: number;
  private _paused = false;
  private _ended = false;

  constructor(durationDays: number) {
    this.durationDays = durationDays;
  }

  tick(dtSeconds: number): void {
    if (this._paused || this._ended) return;
    this.elapsed += dtSeconds;
    if (this.day >= this.durationDays) {
      this._ended = true;
    }
  }

  get day(): number {
    return this.elapsed / SECONDS_PER_DAY;
  }

  get dayWhole(): number {
    return Math.min(this.durationDays, Math.floor(this.day) + 1);
  }

  get daysRemaining(): number {
    return Math.max(0, this.durationDays - this.day);
  }

  get dayFraction(): number {
    return 1 / SECONDS_PER_DAY;
  }

  get ended(): boolean {
    return this._ended;
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
  }

  get paused(): boolean {
    return this._paused;
  }
}
