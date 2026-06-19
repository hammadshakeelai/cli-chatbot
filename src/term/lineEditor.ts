import type { Terminal } from '@xterm/xterm';
import { sgr, RESET, visibleWidth } from './ansi';
import type { Completion } from './types';

export interface EditorCallbacks {
  onSubmit(line: string): void;
  /** Ctrl+C on an idle prompt (line already finalized). */
  onInterrupt(): void;
  onCtrlL?(): void;
  complete?(line: string, cursor: number): Completion | undefined;
  history(): string[];
  onKeySound?(): void;
}

/**
 * A readline-style line editor on top of xterm.js.
 * Full cursor movement, history, tab-completion cycling, kill ops,
 * ghost placeholder text, and wrap-aware in-place redraw.
 */
export class LineEditor {
  active = false;

  private prompt = '';
  private promptVis = 0;
  private ghost: string | undefined;
  private line = '';
  private cursor = 0;

  private lastCursorRow = 0;
  private histIdx: number | null = null;
  private histSaved = '';
  private searchIdx: number | null = null;
  private tabState: {
    items: string[]; idx: number; replaceStart: number; tail: string;
  } | null = null;

  constructor(private term: Terminal, private cb: EditorCallbacks) {}

  startLine(prompt: string, ghost?: string): void {
    this.prompt = prompt;
    this.promptVis = visibleWidth(prompt);
    this.ghost = ghost;
    this.line = '';
    this.cursor = 0;
    this.histIdx = null;
    this.histSaved = '';
    this.searchIdx = null;
    this.tabState = null;
    this.lastCursorRow = 0;
    this.active = true;
    this.render();
  }

  currentLine(): string {
    return this.line;
  }

  /** Replace line content programmatically (e.g. command palette). */
  setLine(text: string): void {
    if (!this.active) return;
    this.line = text;
    this.cursor = text.length;
    this.render();
  }

  /** Re-render after a resize (best effort). */
  refresh(): void {
    if (!this.active) return;
    this.lastCursorRow = 0;
    this.render();
  }

  /**
   * Feed raw terminal data. Returns leftover data that arrived after a
   * submit/cancel (the session should queue it).
   */
  handleData(data: string): string {
    let dirty = false;
    let i = 0;
    const n = data.length;

    while (i < n) {
      if (!this.active) return data.slice(i);
      const ch = data[i]!;

      // ── Escape sequences ──
      if (ch === '\x1b') {
        let j = i + 1;
        if (data[j] === '[' || data[j] === 'O') {
          j++;
          while (j < n && !/[A-Za-z~]/.test(data[j]!)) j++;
          const seq = data.slice(i + 1, j + 1);
          i = j + 1;
          dirty = this.handleCSI(seq) || dirty;
          continue;
        }
        // Bare ESC — ignore at idle prompt
        i++;
        continue;
      }

      if (ch === '\r' || ch === '\n') {
        this.submit();
        i++;
        // swallow the \n of a CRLF pair
        if (ch === '\r' && data[i] === '\n') i++;
        return data.slice(i);
      }

      if (ch === '\x7f') { // Backspace
        if (this.cursor > 0) {
          this.line = this.line.slice(0, this.cursor - 1) + this.line.slice(this.cursor);
          this.cursor--;
          this.resetMeta();
          dirty = true;
        }
        i++;
        continue;
      }

      if (ch === '\x08' || ch === '\x17') { // Ctrl+Backspace / Ctrl+W — delete word
        const start = this.wordLeft();
        if (start < this.cursor) {
          this.line = this.line.slice(0, start) + this.line.slice(this.cursor);
          this.cursor = start;
          this.resetMeta();
          dirty = true;
        }
        i++;
        continue;
      }

      if (ch === '\t') {
        this.onTab();
        i++;
        dirty = false; // onTab renders itself
        continue;
      }

      if (ch === '\x03') { // Ctrl+C
        this.cancel();
        this.cb.onInterrupt();
        i++;
        return data.slice(i);
      }

      if (ch === '\x0c') { // Ctrl+L
        this.cb.onCtrlL?.();
        i++;
        continue;
      }

      if (ch === '\x01') { this.cursor = 0; dirty = true; i++; continue; }            // Ctrl+A
      if (ch === '\x05') { this.cursor = this.line.length; dirty = true; i++; continue; } // Ctrl+E
      if (ch === '\x15') { // Ctrl+U — kill to start
        this.line = this.line.slice(this.cursor);
        this.cursor = 0;
        this.resetMeta(); dirty = true; i++; continue;
      }
      if (ch === '\x0b') { // Ctrl+K — kill to end
        this.line = this.line.slice(0, this.cursor);
        this.resetMeta(); dirty = true; i++; continue;
      }
      if (ch === '\x12') { this.reverseSearch(); i++; dirty = true; continue; } // Ctrl+R

      // Printable (including unicode); skip other control chars
      if (ch >= ' ') {
        this.line = this.line.slice(0, this.cursor) + ch + this.line.slice(this.cursor);
        this.cursor++;
        this.resetMeta();
        this.cb.onKeySound?.();
        dirty = true;
      }
      i++;
    }

    if (dirty && this.active) this.render();
    return '';
  }

  /* ── key handlers ─────────────────────────────────────────────────────── */

  private handleCSI(seq: string): boolean {
    switch (seq) {
      case '[A': case 'OA': this.histNav(-1); return false; // renders itself
      case '[B': case 'OB': this.histNav(1); return false;
      case '[C': case 'OC':
        if (this.cursor < this.line.length) { this.cursor++; return true; }
        return false;
      case '[D': case 'OD':
        if (this.cursor > 0) { this.cursor--; return true; }
        return false;
      case '[H': case 'OH': case '[1~': this.cursor = 0; return true;
      case '[F': case 'OF': case '[4~': this.cursor = this.line.length; return true;
      case '[3~': // Delete
        if (this.cursor < this.line.length) {
          this.line = this.line.slice(0, this.cursor) + this.line.slice(this.cursor + 1);
          this.resetMeta();
          return true;
        }
        return false;
      case '[1;5C': this.cursor = this.wordRight(); return true;
      case '[1;5D': this.cursor = this.wordLeft(); return true;
      default: return false;
    }
  }

  private wordLeft(): number {
    let p = this.cursor;
    while (p > 0 && /[\s\\/]/.test(this.line[p - 1]!)) p--;
    while (p > 0 && !/[\s\\/]/.test(this.line[p - 1]!)) p--;
    return p;
  }

  private wordRight(): number {
    let p = this.cursor;
    const n = this.line.length;
    while (p < n && !/[\s\\/]/.test(this.line[p]!)) p++;
    while (p < n && /[\s\\/]/.test(this.line[p]!)) p++;
    return p;
  }

  private histNav(dir: -1 | 1): void {
    const hist = this.cb.history();
    if (hist.length === 0) return;
    if (dir === -1) {
      if (this.histIdx === null) {
        this.histSaved = this.line;
        this.histIdx = hist.length - 1;
      } else if (this.histIdx > 0) {
        this.histIdx--;
      } else return;
      this.line = hist[this.histIdx] ?? '';
    } else {
      if (this.histIdx === null) return;
      if (this.histIdx < hist.length - 1) {
        this.histIdx++;
        this.line = hist[this.histIdx] ?? '';
      } else {
        this.histIdx = null;
        this.line = this.histSaved;
      }
    }
    this.cursor = this.line.length;
    this.tabState = null;
    this.render();
  }

  private reverseSearch(): void {
    const hist = this.cb.history();
    const query = this.line.trim().toLowerCase();
    if (!query || hist.length === 0) return;
    const start = this.searchIdx === null ? hist.length - 1 : this.searchIdx - 1;
    for (let i = start; i >= 0; i--) {
      if (hist[i]!.toLowerCase().includes(query) && hist[i] !== this.line) {
        this.searchIdx = i;
        this.line = hist[i]!;
        this.cursor = this.line.length;
        return;
      }
    }
  }

  private onTab(): void {
    if (this.tabState) {
      const st = this.tabState;
      st.idx = (st.idx + 1) % st.items.length;
      this.applyTabItem();
      return;
    }
    const res = this.cb.complete?.(this.line, this.cursor);
    if (!res || res.items.length === 0) {
      this.term.write('\x07');
      return;
    }
    const tail = this.line.slice(this.cursor);
    if (res.items.length === 1) {
      this.line = this.line.slice(0, res.replaceStart) + res.items[0]! + tail;
      this.cursor = res.replaceStart + res.items[0]!.length;
      this.tabState = null;
      this.render();
      return;
    }
    const word = this.line.slice(res.replaceStart, this.cursor);
    const prefix = commonPrefix(res.items);
    if (prefix.length > word.length) {
      this.line = this.line.slice(0, res.replaceStart) + prefix + tail;
      this.cursor = res.replaceStart + prefix.length;
      this.tabState = { items: res.items, idx: -1, replaceStart: res.replaceStart, tail };
      this.render();
      return;
    }
    this.tabState = { items: res.items, idx: 0, replaceStart: res.replaceStart, tail };
    this.applyTabItem();
  }

  private applyTabItem(): void {
    const st = this.tabState!;
    const item = st.items[Math.max(0, st.idx)]!;
    this.line = this.line.slice(0, st.replaceStart) + item + st.tail;
    this.cursor = st.replaceStart + item.length;
    this.render();
  }

  private resetMeta(): void {
    this.tabState = null;
    this.histIdx = null;
    this.searchIdx = null;
  }

  /* ── submit / cancel ──────────────────────────────────────────────────── */

  private submit(): void {
    this.finishRegion();
    this.active = false;
    const line = this.line;
    this.line = '';
    this.cursor = 0;
    this.cb.onSubmit(line);
  }

  /** Finalize on Ctrl+C: prints ^C like a real console. */
  private cancel(): void {
    this.finishRegion('\x1b[2m^C\x1b[0m');
    this.active = false;
    this.line = '';
    this.cursor = 0;
  }

  /** Move to end of the input region, optionally append a suffix, newline. */
  private finishRegion(suffix = ''): void {
    let seq = '\r';
    if (this.lastCursorRow > 0) seq += `\x1b[${this.lastCursorRow}A`;
    seq += '\x1b[J' + this.prompt + this.line + suffix + '\r\n';
    this.term.write(seq);
    this.lastCursorRow = 0;
  }

  /* ── rendering ────────────────────────────────────────────────────────── */

  private render(): void {
    const cols = Math.max(2, this.term.cols);
    const ghostActive = this.line.length === 0 && !!this.ghost;

    let seq = '\r';
    if (this.lastCursorRow > 0) seq += `\x1b[${this.lastCursorRow}A`;
    seq += '\x1b[J';

    let contentVis: number;
    if (ghostActive) {
      const g = this.ghost!;
      seq += this.prompt + sgr.dim + g + RESET;
      contentVis = this.promptVis + visibleWidth(g);
    } else {
      seq += this.prompt + this.line;
      contentVis = this.promptVis + this.line.length;
    }

    // Resolve xterm pending-wrap state at exact row multiples
    if (contentVis > 0 && contentVis % cols === 0) seq += ' \b';

    const endRow = Math.floor(contentVis / cols);
    const curVis = this.promptVis + this.cursor;
    const curRow = Math.floor(curVis / cols);
    const curCol = curVis % cols;

    if (endRow > curRow) seq += `\x1b[${endRow - curRow}A`;
    seq += '\r';
    if (curCol > 0) seq += `\x1b[${curCol}C`;

    this.term.write(seq);
    this.lastCursorRow = curRow;
  }
}

function commonPrefix(items: string[]): string {
  if (items.length === 0) return '';
  let prefix = items[0]!;
  for (const it of items) {
    let k = 0;
    while (k < prefix.length && k < it.length &&
           prefix[k]!.toLowerCase() === it[k]!.toLowerCase()) k++;
    prefix = prefix.slice(0, k);
    if (!prefix) break;
  }
  return prefix;
}
