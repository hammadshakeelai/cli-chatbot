'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { useMirageStore } from '@/store';
import { complete } from '@/kernel/completer';
import { applyTheme } from '@/themes/registry';
import { MobileKeyBar } from '@/components/workspace/MobileKeyBar';
import 'xterm/css/xterm.css';

export function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const lineRef = useRef('');
  const currentAbortRef = useRef<AbortController | null>(null);
  const executingRef = useRef(false);
  const tabCycleRef = useRef<{ matches: string[]; idx: number } | null>(null);

  const execute = useMirageStore((s) => s.execute);
  const addHistory = useMirageStore((s) => s.addHistory);
  const vfs = useMirageStore((s) => s.vfs);
  const registry = useMirageStore((s) => s.registry);
  const getActiveSession = useMirageStore((s) => s.getActiveSession);
  const skin = useMirageStore((s) => s.skin);
  const mode = useMirageStore((s) => s.mode);

  const writeOutput = useCallback((term: Terminal, output: string) => {
    term.write(output.replace(/\n/g, '\r\n'));
  }, []);

  const runCommand = useCallback(async (term: Terminal, line: string) => {
    if (executingRef.current) return;
    executingRef.current = true;

    addHistory(line);

    const abortController = new AbortController();
    currentAbortRef.current = abortController;

    const streamOutput = (chunk: string) => {
      writeOutput(term, chunk);
    };

    try {
      const result = await execute(line, abortController.signal, streamOutput);
      // Non-streaming output (w/o onOutput) is returned in result.output
      if (result.output) {
        writeOutput(term, result.output);
      }
    } catch {
      writeOutput(term, 'Error executing command.\r\n');
    } finally {
      currentAbortRef.current = null;
      executingRef.current = false;
    }
  }, [execute, addHistory, writeOutput]);

  const getPrompt = useCallback(() => {
    return '\r\x1b[1;32m$\x1b[0m ';
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply current theme to DOM
    applyTheme(skin, mode);

    const term = new Terminal({
      cursorBlink: false,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: skin.fonts.mono,
      theme: mode === 'dark' ? skin.xtermTheme.dark : skin.xtermTheme.light,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(container);

    try {
      term.loadAddon(new WebglAddon());
    } catch {
      // WebGL unavailable
    }

    fitAddon.fit();

    const ro = new ResizeObserver(() => fitAddon.fit());
    ro.observe(container);

    let line = '';
    const prompt = getPrompt();

    term.onKey(({ key, domEvent }) => {
      if (executingRef.current && (domEvent.key === 'Escape' || (domEvent.ctrlKey && domEvent.key === 'c'))) {
        currentAbortRef.current?.abort();
        currentAbortRef.current = null;
        executingRef.current = false;
        term.write('\r\n\x1b[2mInterrupted.\x1b[0m\r\n');
        term.write(prompt);
        line = '';
        lineRef.current = '';
        return;
      }

      if (domEvent.key === 'Enter') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const cmd = line.trim();
        line = '';
        lineRef.current = '';
        term.write('\r\n');
        if (cmd) {
          runCommand(term, cmd);
        }
        term.write(prompt);
      } else if (domEvent.key === 'Backspace') {
        if (line.length > 0 && !executingRef.current) {
          tabCycleRef.current = null;
          line = line.slice(0, -1);
          lineRef.current = line;
          term.write('\b \b');
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
        term.write(prompt + line);
      } else if (domEvent.key === 'ArrowUp') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const session = getActiveSession();
        const prev = session.history.back();
        if (prev !== undefined) {
          term.write('\r\x1b[K' + prompt + prev);
          line = prev;
          lineRef.current = prev;
        }
      } else if (domEvent.key === 'ArrowDown') {
        if (executingRef.current) return;
        tabCycleRef.current = null;
        const session = getActiveSession();
        const next = session.history.forward();
        if (next !== undefined) {
          term.write('\r\x1b[K' + prompt + next);
          line = next;
          lineRef.current = next;
        } else {
          term.write('\r\x1b[K' + prompt);
          line = '';
          lineRef.current = '';
        }
      } else if (domEvent.key === 'Tab') {
        domEvent.preventDefault();
        if (executingRef.current) return;

        const isFirstWord = !line.includes(' ');
        const partial = line.split(' ').pop() ?? '';

        if (tabCycleRef.current) {
          tabCycleRef.current.idx = (tabCycleRef.current.idx + 1) % tabCycleRef.current.matches.length;
          const match = tabCycleRef.current.matches[tabCycleRef.current.idx]!;
          const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
          line = prefix + match;
          lineRef.current = line;
          term.write('\r\x1b[K' + prompt + line);
          return;
        }

        const result = complete(partial, isFirstWord, registry, vfs, getActiveSession().cwd);

        if (result.matches.length === 0) {
          term.write('\x07'); // Bell
        } else if (result.matches.length === 1) {
          const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
          line = prefix + result.matches[0]!;
          lineRef.current = line;
          term.write('\r\x1b[K' + prompt + line);
        } else {
          // Show candidates
          const commonPrefix = findCommonPrefix(result.matches);
          if (commonPrefix.length > partial.length) {
            const prefix = isFirstWord ? '' : line.slice(0, line.lastIndexOf(' ') + 1);
            line = prefix + commonPrefix;
            lineRef.current = line;
            term.write('\r\x1b[K' + prompt + line);
          } else {
            term.write('\r\n' + result.matches.join('  ') + '\r\n');
            term.write(prompt + line);
          }
          tabCycleRef.current = { matches: result.matches, idx: -1 };
        }
      } else if (domEvent.key.length === 1 && !executingRef.current) {
        tabCycleRef.current = null;
        line += key;
        lineRef.current = line;
        term.write(key);
      }
    });

    term.attachCustomKeyEventHandler((e) => {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Escape')) {
        e.preventDefault();
        return false;
      }
      return true;
    });

    term.writeln('\x1b[1;32mMirage v0.1.0\x1b[0m — virtual terminal');
    term.writeln('Type help to see available commands.\r\n');
    term.write(prompt);

    terminalRef.current = term;

    return () => {
      ro.disconnect();
      term.dispose();
      terminalRef.current = null;
    };
  }, [runCommand, getPrompt, getActiveSession, registry, vfs, skin, mode]);

  // Re-apply theme on skin/mode change
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    applyTheme(skin, mode, term);
  }, [skin, mode]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="terminal-chrome flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="Mirage terminal"
          role="terminal"
        />
      </div>
      <MobileKeyBar onKey={(key) => {
        // handle key via imperative handle
        const term = terminalRef.current;
        if (!term) return;
        if (key === 'Tab') term.write('\t');
        else if (key === 'Ctrl+C') {
          currentAbortRef.current?.abort();
          currentAbortRef.current = null;
          executingRef.current = false;
          term.write('^C\r\n');
        } else if (key === 'Esc') {
          currentAbortRef.current?.abort();
          currentAbortRef.current = null;
          executingRef.current = false;
          term.write('\r\n');
        } else if (key === '↑') term.write('\x1b[A');
        else if (key === '↓') term.write('\x1b[B');
        else if (key === '←') term.write('\x1b[D');
        else if (key === '→') term.write('\x1b[C');
      }} />
      <div className="status-bar">
        <span>Esc to interrupt</span>
        <span>{skin.label} · {mode}</span>
      </div>
    </div>
  );
}

function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0]!;
  for (let i = 1; i < strings.length; i++) {
    while (strings[i]!.indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}
