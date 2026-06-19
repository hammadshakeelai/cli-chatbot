import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { LineEditor } from './lineEditor';
import type { Repl, TermIO, ReplHost } from './types';
import { ShellRepl } from '@/shell/shell';
import type { WinFS } from '@/shell/winfs';
import { useUI } from '@/store/ui';
import type { Settings } from '@/store/ui';
import { variantOf } from '@/themes/apply';
import { FONT_MONO } from '@/lib/constants';
import { playKeyClick } from '@/lib/sound';
import type { Profile } from '@/agents/profiles';

const NEVER = new AbortController();

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * One terminal tab: an xterm instance + a stack of REPLs (PowerShell at the
 * bottom, agents pushed on top). Lives outside React; created once per tab
 * and kept alive across tab switches and theme changes.
 */
export class Session implements TermIO, ReplHost {
  readonly term: Terminal;
  readonly container: HTMLDivElement;

  private fit: FitAddon;
  private editor: LineEditor;
  private replStack: Repl[] = [];
  private shell: ShellRepl;
  private busy = false;
  private abortCtl: AbortController | null = null;
  private pendingInput = '';
  private disposed = false;
  private ro: ResizeObserver;

  constructor(
    readonly tabId: string,
    readonly profile: Profile,
    host: HTMLElement,
    fs: WinFS,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'term-container';
    this.container.style.cssText = 'position:absolute;inset:0;display:none;padding:4px 0 0 8px;';
    host.appendChild(this.container);

    const settings = useUI.getState().settings;
    const v = variantOf(settings.schemeId, settings.mode);

    this.term = new Terminal({
      cursorBlink: settings.cursorBlink,
      cursorStyle: 'bar',
      fontSize: settings.fontSize,
      fontFamily: FONT_MONO,
      theme: v.xterm,
      allowTransparency: false,
      scrollback: 4000,
    });
    this.fit = new FitAddon();
    this.term.loadAddon(this.fit);
    this.term.loadAddon(new WebLinksAddon());
    this.term.open(this.container);

    // WebGL renderer for smoothness; falls back to DOM renderer silently.
    const term = this.term;
    void (async () => {
      try {
        const { WebglAddon } = await import('@xterm/addon-webgl');
        const addon = new WebglAddon();
        addon.onContextLoss(() => addon.dispose());
        term.loadAddon(addon);
      } catch { /* DOM renderer fallback */ }
    })();

    this.editor = new LineEditor(this.term, {
      onSubmit: (line) => this.handleSubmit(line),
      onInterrupt: () => this.handleIdleInterrupt(),
      onCtrlL: () => { this.clear(); this.promptAgain(); },
      complete: (line, cursor) => this.activeRepl().complete?.(line, cursor),
      history: () => this.activeRepl().history,
      onKeySound: () => { if (useUI.getState().settings.sound) playKeyClick(); },
    });

    this.term.onData((data) => this.feed(data));
    this.term.onResize(() => { if (this.editor.active && !this.busy) this.editor.refresh(); });

    this.ro = new ResizeObserver(() => {
      if (this.container.style.display !== 'none') {
        try { this.fit.fit(); } catch { /* ignore mid-teardown */ }
      }
    });
    this.ro.observe(this.container);

    this.shell = new ShellRepl(fs);
    this.replStack.push(this.shell);
  }

  /** Print the shell banner; auto-launch the agent for agent profiles. */
  async boot(): Promise<void> {
    try { this.fit.fit(); } catch { /* not visible yet */ }
    await this.shell.onAttach(this, true);
    this.promptAgain();
    if (this.profile.kind === 'agent' && this.profile.command) {
      await this.autoType(this.profile.command);
    }
  }

  /** Auto-type a command like a Windows Terminal profile `commandline`. */
  private async autoType(cmd: string): Promise<void> {
    await wait(300);
    for (const ch of cmd) {
      if (this.disposed) return;
      this.feed(ch);
      await wait(24 + Math.random() * 36);
    }
    await wait(140);
    if (!this.disposed) this.feed('\r');
  }

  /** Public input entry (keyboard, mobile key bar, palette). */
  feed(data: string): void {
    if (this.disposed) return;
    if (this.busy) {
      if (data.includes('\x03') || data === '\x1b') {
        this.abortCtl?.abort();
        return;
      }
      this.pendingInput += data;
      return;
    }
    if (!this.editor.active) {
      this.pendingInput += data;
      return;
    }
    const leftover = this.editor.handleData(data);
    if (leftover) this.pendingInput += leftover;
  }

  /** Type + run a command programmatically (command palette). */
  runCommand(cmd: string): void {
    this.feed(cmd + '\r');
  }

  private activeRepl(): Repl {
    return this.replStack[this.replStack.length - 1]!;
  }

  private handleSubmit(line: string): void {
    const repl = this.activeRepl();
    const trimmed = line.trim();
    if (trimmed) {
      const h = repl.history;
      if (h[h.length - 1] !== line) h.push(line);
      if (h.length > 200) h.shift();
    } else {
      this.promptAgain();
      return;
    }

    this.busy = true;
    useUI.getState().setTabBusy(this.tabId, true);
    this.abortCtl = new AbortController();

    repl.run(line, this, this)
      .catch((err) => {
        if (!this.signal().aborted) {
          this.writeln('\x1b[91m' + ((err as Error)?.message ?? 'command failed') + '\x1b[0m');
        }
      })
      .finally(() => {
        this.busy = false;
        this.abortCtl = null;
        if (this.disposed) return;
        useUI.getState().setTabBusy(this.tabId, false);
        useUI.getState().setTabCwd(this.tabId, this.shell.state.cwd);
        this.promptAgain();
      });
  }

  private promptAgain(): void {
    if (this.disposed) return;
    const repl = this.activeRepl();
    this.editor.startLine(repl.prompt(), repl.ghost?.());
    if (this.pendingInput) {
      const data = this.pendingInput;
      this.pendingInput = '';
      this.feed(data);
    }
  }

  private handleIdleInterrupt(): void {
    const repl = this.activeRepl();
    const result = repl.onIdleInterrupt?.(this);
    if (result === 'exit' && this.replStack.length > 1) {
      this.replStack.pop();
      void this.activeRepl().onAttach(this, false);
    }
    this.promptAgain();
  }

  /* ── ReplHost ─────────────────────────────────────────────────────────── */

  async pushRepl(repl: Repl): Promise<void> {
    this.replStack.push(repl);
    await repl.onAttach(this, true);
  }

  popRepl(): void {
    if (this.replStack.length <= 1) {
      this.closeTab();
      return;
    }
    this.replStack.pop();
    void this.activeRepl().onAttach(this, false);
  }

  closeTab(): void {
    useUI.getState().closeTab(this.tabId);
  }

  /* ── TermIO ───────────────────────────────────────────────────────────── */

  write(s: string): void {
    this.term.write(s.replace(/\r?\n/g, '\r\n'));
  }

  writeln(s = ''): void {
    this.write(s + '\n');
  }

  clear(): void {
    this.term.write('\x1b[2J\x1b[3J\x1b[H');
  }

  cols(): number { return this.term.cols; }
  rows(): number { return this.term.rows; }

  setTitle(title: string): void {
    useUI.getState().setLiveTitle(this.tabId, title);
  }

  signal(): AbortSignal {
    return this.abortCtl?.signal ?? NEVER.signal;
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const sig = this.signal();
      if (sig.aborted) { resolve(); return; }
      const onAbort = () => { clearTimeout(t); resolve(); };
      const t = setTimeout(() => {
        sig.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      sig.addEventListener('abort', onAbort, { once: true });
    });
  }

  /* ── lifecycle ────────────────────────────────────────────────────────── */

  activate(): void {
    this.container.style.display = 'block';
    try { this.fit.fit(); } catch { /* ignore */ }
    this.term.focus();
  }

  deactivate(): void {
    this.container.style.display = 'none';
  }

  applySettings(settings: Settings): void {
    const v = variantOf(settings.schemeId, settings.mode);
    this.term.options.theme = v.xterm;
    this.term.options.fontSize = settings.fontSize;
    this.term.options.cursorBlink = settings.cursorBlink;
    if (this.container.style.display !== 'none') {
      try { this.fit.fit(); } catch { /* ignore */ }
    }
  }

  focus(): void {
    this.term.focus();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abortCtl?.abort();
    this.ro.disconnect();
    this.term.dispose();
    this.container.remove();
  }
}
