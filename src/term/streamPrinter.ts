import { sgr, RESET } from './ansi';

/**
 * Streaming markdown → ANSI renderer with word-wrap.
 *
 * Handles, token-by-token without repainting:
 *   **bold**  *italic*  `inline code`  # headings  - bullets  1. lists
 *   > quotes  ``` fenced code blocks ```
 *
 * The LLM personas are instructed to emit plain markdown; this printer owns
 * ALL styling, so output looks consistent regardless of model behavior.
 */

export interface PrinterOpts {
  /** Wrap width in visible columns (live — re-read each line for resizes). */
  width(): number;
  /** Prefix for the very first output line (e.g. an accent glyph "⏺ "). */
  firstPrefix?: string;
  /** Visible width of firstPrefix. */
  firstPrefixWidth?: number;
  /** Indent for all other lines (plain spaces). */
  indent?: string;
  /** SGR color prefix for inline code + code blocks. */
  codeColor?: string;
  /** SGR color prefix for headings. */
  headingColor?: string;
  /** Bullet glyph. */
  bullet?: string;
}

type LineMode =
  | { kind: 'normal' }
  | { kind: 'heading' }
  | { kind: 'bullet' }
  | { kind: 'quote' }
  | { kind: 'code' };

export class StreamPrinter {
  private startBuf = '';        // undecided start-of-line buffer
  private atLineStart = true;
  private mode: LineMode = { kind: 'normal' };
  private inFence = false;

  private bold = false;
  private italic = false;
  private code = false;
  private pendingStar = false;

  private word = '';            // current word (raw output incl. SGR)
  private wordVis = 0;          // visible width of word
  private col = 0;              // current visible column on the row
  private begun = false;        // anything printed yet
  private lineHasContent = false;

  constructor(private writeOut: (s: string) => void, private opts: PrinterOpts) {}

  push(text: string): void {
    for (const ch of text.replace(/\r/g, '')) this.feed(ch);
  }

  /** Flush any pending word / partial state. */
  end(): void {
    if (this.startBuf) this.decideLine(false);
    this.flushWord();
    if (this.pendingStar) { this.emitWordChar('*'); this.flushWord(); }
    if (this.begun && this.lineHasContent) this.writeOut(RESET + '\n');
    else if (this.begun) this.writeOut(RESET);
  }

  /* ── internals ──────────────────────────────────────────────────────────── */

  private feed(ch: string): void {
    if (ch === '\n') {
      if (this.atLineStart && this.startBuf) this.decideLine(false);
      this.newline();
      return;
    }
    // Swallow the remainder of fence marker lines (language tags etc.)
    if (this.swallowLine) return;
    if (this.inFence || this.mode.kind === 'code') {
      this.feedCode(ch);
      return;
    }
    if (this.atLineStart) {
      this.startBuf += ch;
      if (!this.maybeMarker()) this.decideLine(true);
      return;
    }
    this.feedInline(ch);
  }

  /** Is startBuf still a possible prefix of a line marker? Returns true if undecided/decided. */
  private maybeMarker(): boolean {
    const b = this.startBuf;
    // fences
    if (/^`{1,2}$/.test(b)) return true;
    if (b === '```') {
      this.startBuf = '';
      if (this.inFence) {
        this.inFence = false;          // closing fence
        this.mode = { kind: 'normal' };
        this.swallowLine = true;       // ignore trailing chars on fence line
      } else {
        this.inFence = true;
        this.mode = { kind: 'code' };
        this.swallowLine = true;       // ignore language tag
      }
      return true;
    }
    // headings
    if (/^#{1,6}$/.test(b)) return true;
    const heading = /^(#{1,6}) $/.exec(b);
    if (heading) {
      this.startBuf = '';
      this.mode = { kind: 'heading' };
      this.beginLine();
      this.writeOut((this.opts.headingColor ?? sgr.brightCyan) + sgr.bold);
      this.bold = true;
      return true;
    }
    // bullets
    if (b === '-' || b === '*' || b === '+') return true;
    if (/^[-*+] $/.test(b)) {
      this.startBuf = '';
      this.mode = { kind: 'bullet' };
      this.beginLine();
      const bullet = (this.opts.bullet ?? '•') + ' ';
      this.writeOut(sgr.dim + bullet + RESET);
      this.col += 2;
      this.lineHasContent = true;
      return true;
    }
    // numbered lists
    if (/^\d{1,3}\.?$/.test(b)) return true;
    if (/^\d{1,3}\. $/.test(b)) {
      const label = b;
      this.startBuf = '';
      this.mode = { kind: 'bullet' };
      this.beginLine();
      this.writeOut(sgr.bold + label + RESET);
      this.col += label.length;
      this.lineHasContent = true;
      return true;
    }
    // quote
    if (b === '>') return true;
    if (b === '> ') {
      this.startBuf = '';
      this.mode = { kind: 'quote' };
      this.beginLine();
      this.writeOut(sgr.dim + '│ ');
      this.col += 2;
      this.lineHasContent = true;
      return true;
    }
    return false;
  }

  /** No marker matched — flush the buffered start through the inline pipeline. */
  private decideLine(keepFeeding: boolean): void {
    const buf = this.startBuf;
    this.startBuf = '';
    this.mode = { kind: 'normal' };
    this.atLineStart = false;
    this.beginLine();
    for (const c of buf) this.feedInline(c);
    void keepFeeding;
  }

  private swallowLine = false;

  private feedCode(ch: string): void {
    // Detect closing fence at line starts inside code
    if (this.atLineStart) {
      this.startBuf += ch;
      if (/^`{1,3}$/.test(this.startBuf)) {
        if (this.startBuf === '```') {
          this.inFence = false;
          this.mode = { kind: 'normal' };
          this.startBuf = '';
          this.swallowLine = true;
        }
        return;
      }
      // not a fence — emit buffered chars as code
      const buf = this.startBuf;
      this.startBuf = '';
      this.atLineStart = false;
      this.beginLine(true);
      for (const c of buf) this.emitCodeChar(c);
      return;
    }
    if (this.swallowLine) return;
    this.emitCodeChar(ch);
  }

  private emitCodeChar(ch: string): void {
    const width = Math.max(20, this.opts.width());
    const indent = this.codeIndent();
    if (this.col >= width) {
      this.writeOut(RESET + '\n' + indent);
      this.col = indent.length;
      this.writeOut(this.opts.codeColor ?? sgr.brightGreen);
    }
    this.writeOut(ch);
    this.col++;
    this.lineHasContent = true;
  }

  private codeIndent(): string {
    return (this.opts.indent ?? '') + '  ';
  }

  private feedInline(ch: string): void {
    // ** and * handling with one-char lookbehind
    if (this.pendingStar) {
      this.pendingStar = false;
      if (ch === '*') {
        this.bold = !this.bold;
        this.word += this.bold ? sgr.bold : sgr.noBold;
        return;
      }
      this.italic = !this.italic;
      this.word += this.italic ? sgr.italic : sgr.noItalic;
      // fall through to process ch normally
    }
    if (ch === '*') { this.pendingStar = true; return; }
    if (ch === '`') {
      this.code = !this.code;
      this.word += this.code ? (this.opts.codeColor ?? sgr.brightGreen) : (sgr.fgDefault + this.restoreLineColor());
      return;
    }
    if (ch === ' ' || ch === '\t') {
      this.flushWord();
      this.spacePending = true;
      return;
    }
    this.emitWordChar(ch);
  }

  private spacePending = false;

  private emitWordChar(ch: string): void {
    this.word += ch;
    this.wordVis++;
    // Hard-split absurdly long words (URLs)
    const width = Math.max(20, this.opts.width());
    if (this.wordVis >= width - this.indentWidth() - 1) this.flushWord();
  }

  private indentWidth(): number {
    return (this.opts.indent ?? '').length + (this.mode.kind === 'bullet' || this.mode.kind === 'quote' ? 2 : 0);
  }

  private flushWord(): void {
    if (!this.word) { return; }
    const width = Math.max(20, this.opts.width());
    const space = this.spacePending ? 1 : 0;
    if (this.col + space + this.wordVis > width && this.col > this.indentWidth()) {
      // wrap
      this.writeOut(RESET + '\n' + this.wrapIndent() + this.currentSGR());
      this.col = this.indentWidth();
    } else if (this.spacePending) {
      this.writeOut(' ');
      this.col++;
    }
    this.beginLine();
    this.writeOut(this.word);
    this.col += this.wordVis;
    this.lineHasContent = true;
    this.word = '';
    this.wordVis = 0;
    this.spacePending = false;
  }

  private wrapIndent(): string {
    const base = this.opts.indent ?? '';
    if (this.mode.kind === 'bullet') return base + '  ';
    if (this.mode.kind === 'quote') return base + sgr.dim + '│ ' + RESET;
    return base;
  }

  private currentSGR(): string {
    let s = '';
    if (this.mode.kind === 'heading') s += (this.opts.headingColor ?? sgr.brightCyan);
    if (this.bold || this.mode.kind === 'heading') s += sgr.bold;
    if (this.italic) s += sgr.italic;
    if (this.code) s += (this.opts.codeColor ?? sgr.brightGreen);
    return s;
  }

  private restoreLineColor(): string {
    return this.mode.kind === 'heading' ? (this.opts.headingColor ?? sgr.brightCyan) : '';
  }

  /** Lazily print the first-line prefix / per-line indent. */
  private beginLine(codeLine = false): void {
    if (!this.begun) {
      this.begun = true;
      const prefix = this.opts.firstPrefix ?? '';
      this.writeOut(prefix);
      this.col = this.opts.firstPrefixWidth ?? prefix.length;
      if (codeLine) {
        this.writeOut(RESET + '\n' + this.codeIndent() + (this.opts.codeColor ?? sgr.brightGreen));
        this.col = this.codeIndent().length;
      }
      return;
    }
    if (this.needIndent) {
      this.needIndent = false;
      if (codeLine || this.mode.kind === 'code') {
        this.writeOut(this.codeIndent() + (this.opts.codeColor ?? sgr.brightGreen));
        this.col = this.codeIndent().length;
      } else {
        const indent = this.opts.indent ?? '';
        this.writeOut(indent + this.currentSGR());
        this.col = indent.length;
      }
    }
  }

  private needIndent = false;

  private newline(): void {
    // Reset inline state at EOL (markdown inline doesn't span lines)
    this.flushWord();
    if (this.pendingStar) { this.emitWordChar('*'); this.flushWord(); this.pendingStar = false; }
    this.bold = false;
    this.italic = false;
    this.code = false;
    this.spacePending = false;

    if (this.swallowLine) {
      this.swallowLine = false;
    } else if (this.begun) {
      this.writeOut(RESET + '\n');
    }
    this.col = 0;
    this.needIndent = true;
    this.atLineStart = true;
    this.lineHasContent = false;
    this.mode = this.inFence ? { kind: 'code' } : { kind: 'normal' };
  }
}
