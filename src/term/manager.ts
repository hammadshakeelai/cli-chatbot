import { Session } from './session';
import { WinFS } from '@/shell/winfs';
import { profileById } from '@/agents/profiles';
import { useUI } from '@/store/ui';

/**
 * Owns all live terminal sessions (imperative, outside React).
 * React mounts a host element and tells the manager which tab is active;
 * sessions are created once and shown/hidden — never rebuilt.
 */
class SessionManager {
  /** One filesystem shared by every tab — like a real machine. */
  readonly fs = new WinFS();

  private sessions = new Map<string, Session>();
  private host: HTMLElement | null = null;

  setHost(el: HTMLElement | null): void {
    this.host = el;
  }

  ensure(tabId: string, profileId: string): Session | undefined {
    if (!this.host) return undefined;
    let s = this.sessions.get(tabId);
    if (!s) {
      s = new Session(tabId, profileById(profileId), this.host, this.fs);
      this.sessions.set(tabId, s);
      void s.boot();
    }
    return s;
  }

  get(tabId: string): Session | undefined {
    return this.sessions.get(tabId);
  }

  activate(tabId: string): void {
    for (const [id, s] of this.sessions) {
      if (id === tabId) s.activate();
      else s.deactivate();
    }
  }

  dispose(tabId: string): void {
    this.sessions.get(tabId)?.dispose();
    this.sessions.delete(tabId);
  }

  /** Dispose any session whose tab no longer exists. */
  prune(validIds: Set<string>): void {
    for (const id of [...this.sessions.keys()]) {
      if (!validIds.has(id)) this.dispose(id);
    }
  }

  disposeAll(): void {
    for (const s of this.sessions.values()) s.dispose();
    this.sessions.clear();
  }

  /** Push current settings into every live terminal. */
  applySettings(): void {
    const settings = useUI.getState().settings;
    for (const s of this.sessions.values()) s.applySettings(settings);
  }

  /** Feed input to the active session (mobile key bar / palette). */
  feedActive(data: string): void {
    const { activeTabId } = useUI.getState();
    this.sessions.get(activeTabId)?.feed(data);
  }

  runInActive(cmd: string): void {
    const { activeTabId } = useUI.getState();
    this.sessions.get(activeTabId)?.runCommand(cmd);
  }

  focusActive(): void {
    const { activeTabId } = useUI.getState();
    this.sessions.get(activeTabId)?.focus();
  }

  /** Plain-text contents of the active terminal buffer (used by e2e tests). */
  activeBufferText(): string {
    const { activeTabId } = useUI.getState();
    const s = this.sessions.get(activeTabId);
    if (!s) return '';
    const buf = s.term.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buf.length; i++) {
      lines.push(buf.getLine(i)?.translateToString(true) ?? '');
    }
    return lines.join('\n');
  }
}

export const manager = new SessionManager();
