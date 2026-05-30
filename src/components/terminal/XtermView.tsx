'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useMirageStore, type SessionType } from '@/store';
import { playKeyClick } from '@/lib/sound';
import { complete } from '@/kernel/completer';
import { applyTheme, getSkin } from '@/themes/registry';
import { MobileKeyBar } from '@/components/workspace/MobileKeyBar';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { APP_VERSION } from '@/lib/constants';
import '@xterm/xterm/css/xterm.css';

let tabCycleIndex = 0;

export function XtermView() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [statusCwd, setStatusCwd]         = useState('/home/user');
  const [statusModel, setStatusModel]     = useState('');

  const containerRef      = useRef<HTMLDivElement>(null);
  const terminalRef       = useRef<Terminal | null>(null);
  const lineRef           = useRef('');
  const currentAbortRef   = useRef<AbortController | null>(null);
  const executingRef      = useRef(false);
  const tabCycleRef       = useRef<{ matches: string[]; idx: number } | null>(null);

  const execute          = useMirageStore((s) => s.execute);
  const addHistory       = useMirageStore((s) => s.addHistory);
  const vfs              = useMirageStore((s) => s.vfs);
  const registry         = useMirageStore((s) => s.registry);
  const getActiveSession = useMirageStore((s) => s.getActiveSession);
  const activeSessionId  = useMirageStore((s) => s.activeSessionId);
  const skin             = useMirageStore((s) => s.skin);
  const mode             = useMirageStore((s) => s.mode);
  const soundFx          = useMirageStore((s) => s.soundFx);

  const currentSkin = useMemo(() => {
    try {
      const session = getActiveSession();
      if (session.tabSkin) return getSkin(session.tabSkin) ?? skin;
    } catch { /* ignore */ }
    return skin;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, getActiveSession, skin]);

  // Refresh status bar whenever session changes
  useEffect(() => {
    try {
      const s = getActiveSession();
      setStatusCwd(s.cwd);
      setStatusModel(s.chat.model);
    } catch { /* ignore */ }
  }, [activeSessionId, getActiveSession]);

  // Listen for palette-dispatched run-command events
  useEffect(() => {
    const handler = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail;
      if (!cmd || executingRef.current) return;
      const term = terminalRef.current;
      if (!term) return;
      const session = getActiveSession();
      term.write(cmd + '\r\n');
      runCommandRef.current?.(term, cmd);
      term.write(getPromptRef.current?.(session.type) ?? '\r\x1b[1;32m$\x1b[0m ');
    };
    window.addEventListener('mirage:run-command', handler);
    return () => window.removeEventListener('mirage:run-command', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getActiveSession]);

  const writeOutput = useCallback((term: Terminal, output: string) => {
    term.write(output.replace(/\n/g, '\r\n'));
  }, []);

  const runCommand = useCallback(async (term: Terminal, line: string) => {
    if (executingRef.current) return;
    executingRef.current = true;
    setIsGenerating(true);

    addHistory(line);

    const abortController = new AbortController();
    currentAbortRef.current = abortController;

    try {
      const result = await execute(line, abortController.signal, (chunk) => writeOutput(term, chunk));
      if (result.output) writeOutput(term, result.output);

      // Update status bar
      try {
        const s = getActiveSession();
        setStatusCwd(s.cwd);
        setStatusModel(s.chat.model);
      } catch { /* ignore */ }
    } catch {
      writeOutput(term, 'Error executing command.\r\n');
    } finally {
      currentAbortRef.current = null;
      executingRef.current    = false;
      setIsGenerating(false);
    }
  }, [execute, addHistory, writeOutput, getActiveSession]);

  // Keep refs current so the palette event handler can call the latest runCommand
  const runCommandRef  = useRef(runCommand);
  const getPromptRef   = useRef<((type: SessionType) => string) | null>(null);
  useEffect(() => { runCommandRef.current = runCommand; }, [runCommand]);

  const getPrompt = useCallback((_type: SessionType) => {
    if (currentSkin.prompt) return '\r' + currentSkin.prompt;
    return '\r\x1b[1;32m$\x1b[0m ';
  }, [currentSkin]);
  useEffect(() => { getPromptRef.current = getPrompt; }, [getPrompt]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentSession = getActiveSession();
    const sessionType    = currentSession.type;
    const isChatTab      = sessionType === 'chat';
    const isMythosTab    = sessionType === 'mythos';

    applyTheme(currentSkin, mode);

    const term = new Terminal({
      cursorBlink:      true,
      cursorStyle:      'block',
      fontSize:         14,
      fontFamily:       currentSkin.fonts.mono,
      theme:            mode === 'dark' ? currentSkin.xtermTheme.dark : currentSkin.xtermTheme.light,
      allowTransparency: false,
      scrollback:       2000,
    });

    const fitAddon      = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(container);
    fitAddon.fit();

    const ro = new ResizeObserver(() => fitAddon.fit());
    ro.observe(container);

    let line   = '';
    const prompt = getPrompt(sessionType);

    term.onKey(({ key, domEvent }) => {
      // Interrupt running command
      if (executingRef.current && (domEvent.key === 'Escape' || (domEvent.ctrlKey && domEvent.key === 'c'))) {
        currentAbortRef.current?.abort();
        currentAbortRef.current = null;
        executingRef.current    = false;
        setIsGenerating(false);
        term.write('\r\n\x1b[2mInterrupted.\x1b[0m\r\n');
        term.write(prompt);
        line = ''; lineRef.current = '';
        return;
      }

      if (domEvent.key === 'Enter') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const cmd = line.trim();
        line = ''; lineRef.current = '';
        term.write('\r\n');
        if (cmd) {
          const isAiType  = isChatTab || isMythosTab;
          const finalCmd  = isAiType && !cmd.startsWith('/')
            ? `ai ${cmd}`
            : isAiType && cmd.startsWith('/')
              ? cmd.slice(1)
              : cmd;
          const expanded = isAiType
            ? finalCmd
            : expandHistory(cmd, getActiveSession().history.getAll());
          if (expanded !== cmd && !isAiType) term.write(expanded + '\r\n');
          runCommand(term, expanded);
        }
        term.write(prompt);

      } else if (domEvent.ctrlKey && domEvent.key === 'r') {
        domEvent.preventDefault();
        if (executingRef.current) return;
        const search = line.trim().toLowerCase();
        if (!search) { term.write('\x07'); return; }
        const all = getActiveSession().history.getAll();
        const match = [...all].reverse().find((h) => h.toLowerCase().includes(search));
        if (match) {
          term.write('\r\x1b[K\x1b[2m(reverse-i-search)\x1b[0m`' + search + '`: ');
          line = match; lineRef.current = match;
          term.write(match);
        } else { term.write('\x07'); }

      } else if (domEvent.key === 'Backspace') {
        if (line.length > 0 && !executingRef.current) {
          tabCycleRef.current = null;
          line = line.slice(0, -1); lineRef.current = line;
          term.write('\b \b');
        }

      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
        term.write(prompt + line);

      } else if (domEvent.key === 'ArrowUp') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const prev = getActiveSession().history.back();
        if (prev !== undefined) { term.write('\r\x1b[K' + prompt + prev); line = prev; lineRef.current = prev; }

      } else if (domEvent.key === 'ArrowDown') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const next = getActiveSession().history.forward();
        if (next !== undefined) { term.write('\r\x1b[K' + prompt + next); line = next; lineRef.current = next; }
        else { term.write('\r\x1b[K' + prompt); line = ''; lineRef.current = ''; }

      } else if (domEvent.key === 'Tab') {
        domEvent.preventDefault();
        if (executingRef.current) return;

        const isFirstWord = !line.includes(' ');
        const partial     = line.split(' ').pop() ?? '';

        if (tabCycleRef.current) {
          tabCycleRef.current.idx = (tabCycleRef.current.idx + 1) % tabCycleRef.current.matches.length;
          const match  = tabCycleRef.current.matches[tabCycleRef.current.idx]!;
          const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
          line = prefix + match; lineRef.current = line;
          term.write('\r\x1b[K' + prompt + line);
          return;
        }

        const result = complete(partial, isFirstWord, registry, vfs, getActiveSession().cwd);
        if (result.matches.length === 0) {
          term.write('\x07');
        } else if (result.matches.length === 1) {
          const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
          line = prefix + result.matches[0]!; lineRef.current = line;
          term.write('\r\x1b[K' + prompt + line);
        } else {
          const commonPrefix = findCommonPrefix(result.matches);
          if (commonPrefix.length > partial.length) {
            const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
            line = prefix + commonPrefix; lineRef.current = line;
            term.write('\r\x1b[K' + prompt + line);
          } else {
            term.write('\r\n' + result.matches.join('  ') + '\r\n');
            term.write(prompt + line);
          }
          tabCycleRef.current = { matches: result.matches, idx: -1 };
        }

      } else if (domEvent.key.length === 1 && !executingRef.current) {
        if (soundFx) playKeyClick();
        tabCycleRef.current = null;
        line += key; lineRef.current = line;
        term.write(key);
      }
    });

    term.attachCustomKeyEventHandler((e) => {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Escape')) {
        e.preventDefault();
        return false;
      }
      if (e.type === 'keydown' && (e.ctrlKey || e.metaKey)) {
        const store = useMirageStore.getState();
        if (e.key === 't') { e.preventDefault(); store.createSession(); return false; }
        if (e.key === 'w') {
          e.preventDefault();
          if (store.sessionOrder.length > 1) store.closeSession(store.activeSessionId);
          return false;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const order = store.sessionOrder;
          if (order.length > 1) {
            tabCycleIndex = (tabCycleIndex + 1) % order.length;
            store.switchSession(order[tabCycleIndex]!.id);
          }
          return false;
        }
      }
      return true;
    });

    // Initial banner
    if (isMythosTab) {
      term.writeln(currentSkin.banner({ model: currentSession.chat.model || 'sonnet-4.7', cwd: currentSession.cwd || '/root', mode }));
      term.writeln('');
    } else if (isChatTab) {
      term.writeln(currentSkin.banner({ model: currentSession.chat.model || 'auto', cwd: currentSession.cwd || '/home/user', mode }));
      term.writeln('\x1b[2mType to chat · /help for commands · Esc to interrupt\x1b[0m');
      term.writeln('');
    } else {
      term.writeln(currentSkin.banner({ model: currentSession.chat.model || 'Opus 4.7 (1M context)', cwd: currentSession.cwd || '~/Documents/asciiart', mode }));
      term.writeln('');
    }
    term.write(prompt);
    term.refresh(0, term.rows - 1);

    terminalRef.current = term;

    // Expose for Playwright e2e — development only
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      (window as any).__mirageTerminal = term;
      (window as any).__mirageRunCommand = async (cmd: string) => {
        if (executingRef.current) return;
        term.write(cmd + '\r\n');
        const session  = getActiveSession();
        const isAiType = session.type === 'chat' || session.type === 'mythos';
        const finalCmd = isAiType && !cmd.startsWith('/') ? `ai ${cmd}` : isAiType ? cmd.slice(1) : cmd;
        const expanded = isAiType ? finalCmd : expandHistory(cmd, session.history.getAll());
        await runCommand(term, expanded);
        term.write(getPrompt(session.type));
      };
    }

    return () => {
      if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        delete (window as any).__mirageTerminal;
        delete (window as any).__mirageRunCommand;
      }
      ro.disconnect();
      term.dispose();
      terminalRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runCommand, getPrompt, getActiveSession, registry, vfs, skin, mode, soundFx, activeSessionId, currentSkin]);

  // Re-apply theme on skin/mode change without rebuilding the terminal
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    applyTheme(currentSkin, mode, term);
  }, [skin, mode, currentSkin]);

  // ── Derived status values ──────────────────────────────────────────────────
  const modelShort = statusModel
    ? statusModel.split(':').slice(1).join(':') || statusModel
    : '';

  const cwdShort = statusCwd.replace('/home/user', '~');

  return (
    <div className="flex h-full w-full flex-col">
      {/* Terminal viewport */}
      <div className="terminal-chrome flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="Mirage terminal"
          role="terminal"
        />
      </div>

      {/* Mobile key bar */}
      <MobileKeyBar
        onKey={(key) => {
          const term = terminalRef.current;
          if (!term) return;
          if (key === 'Tab')    term.write('\t');
          else if (key === 'Ctrl+C') {
            currentAbortRef.current?.abort();
            currentAbortRef.current = null;
            executingRef.current    = false;
            setIsGenerating(false);
            term.write('^C\r\n');
          }
          else if (key === 'Esc') {
            currentAbortRef.current?.abort();
            currentAbortRef.current = null;
            executingRef.current    = false;
            setIsGenerating(false);
            term.write('\r\n');
          }
          else if (key === '↑') term.write('\x1b[A');
          else if (key === '↓') term.write('\x1b[B');
          else if (key === '←') term.write('\x1b[D');
          else if (key === '→') term.write('\x1b[C');
          else if (key === '/')    { term.write('/'); }
          else if (key === '|')   { term.write('|'); }
          else if (key === '~')   { term.write('~'); }
        }}
        onCommand={async (cmd) => {
          const term = terminalRef.current;
          if (!term || executingRef.current) return;
          term.write(cmd + '\r\n');
          const session  = getActiveSession();
          const isAiType = session.type === 'chat' || session.type === 'mythos';
          const finalCmd = isAiType && !cmd.startsWith('/') ? `ai ${cmd}` : isAiType ? cmd.slice(1) : cmd;
          const expanded = isAiType ? finalCmd : expandHistory(cmd, session.history.getAll());
          await runCommand(term, expanded);
          term.write(getPrompt(session.type));
        }}
      />

      {/* Status bar */}
      <div className="status-bar">
        <span className="flex items-center gap-3 text-xs" style={{ opacity: 0.65 }}>
          {isGenerating
            ? <span style={{ color: 'var(--accent)' }}>⋯ generating</span>
            : <span>Esc to interrupt</span>
          }
          <span style={{ opacity: 0.4 }}>|</span>
          <span title={statusCwd}>{cwdShort}</span>
        </span>
        <span className="flex items-center gap-2 text-xs" style={{ opacity: 0.65 }}>
          {modelShort && (
            <>
              <span style={{ opacity: 0.5 }}>{modelShort}</span>
              <span style={{ opacity: 0.3 }}>·</span>
            </>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="cursor-pointer rounded px-1.5 py-0.5 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--fg-dim)',
              border: 'none',
              fontSize: '11px',
              fontFamily: 'var(--font-ui)',
            }}
            aria-label="Open settings"
          >
            ⚙ settings
          </button>
          <span style={{ opacity: 0.5 }}>v{APP_VERSION}</span>
        </span>
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function expandHistory(cmd: string, history: string[]): string {
  if (cmd === '!!') return history[history.length - 1] ?? cmd;
  if (/^!\d+$/.test(cmd)) {
    const idx = parseInt(cmd.slice(1), 10);
    if (idx > 0 && idx <= history.length) return history[idx - 1]!;
  }
  if (cmd.startsWith('!') && cmd.length > 1) {
    const search = cmd.slice(1).toLowerCase();
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]!.toLowerCase().startsWith(search)) return history[i]!;
    }
  }
  return cmd;
}

function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0]!;
  for (let i = 1; i < strings.length; i++) {
    while (strings[i]!.indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}
