import type { TermIO } from './types';
import { RESET } from './ansi';

export interface SpinnerOpts {
  frames: string[];
  /** SGR prefix for the frame glyph (e.g. truecolor accent). */
  frameColor: string;
  intervalMs?: number;
  /** Builds the text after the glyph; receives elapsed ms. */
  text(elapsedMs: number): string;
}

/** An in-place single-line spinner (`\r`-based, like real CLI tools). */
export class Spinner {
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private started = 0;
  private visible = false;

  constructor(private io: TermIO, private opts: SpinnerOpts) {}

  start(): void {
    if (this.timer) return;
    this.started = Date.now();
    this.render();
    this.timer = setInterval(() => this.render(), this.opts.intervalMs ?? 110);
  }

  private render(): void {
    const f = this.opts.frames[this.frame % this.opts.frames.length]!;
    this.frame++;
    const text = this.opts.text(Date.now() - this.started);
    this.io.term.write('\r\x1b[K' + this.opts.frameColor + f + RESET + ' ' + text);
    this.visible = true;
  }

  /** Temporarily clear the spinner line so other output can be printed. */
  pause(): void {
    if (this.visible) {
      this.io.term.write('\r\x1b[K');
      this.visible = false;
    }
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  resume(): void {
    if (!this.timer) {
      this.render();
      this.timer = setInterval(() => this.render(), this.opts.intervalMs ?? 110);
    }
  }

  /** Stop and clear the line. */
  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.visible) {
      this.io.term.write('\r\x1b[K');
      this.visible = false;
    }
  }

  elapsedMs(): number {
    return this.started ? Date.now() - this.started : 0;
  }
}
