'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { useMirageStore } from '@/store';
import 'xterm/css/xterm.css';

export function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const lineRef = useRef('');
  const currentAbortRef = useRef<AbortController | null>(null);
  const executingRef = useRef(false);

  const execute = useMirageStore((s) => s.execute);
  const addHistory = useMirageStore((s) => s.addHistory);
  const navigateHistory = useMirageStore((s) => s.navigateHistory);

  const writeOutput = useCallback((term: Terminal, output: string) => {
    term.write(output.replace(/\n/g, '\r\n'));
  }, []);

  const runCommand = useCallback(async (term: Terminal, line: string) => {
    if (executingRef.current) return;
    executingRef.current = true;

    addHistory(line);

    const abortController = new AbortController();
    currentAbortRef.current = abortController;

    try {
      const result = await execute(line);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      theme: {
        background: '#000000',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
        selectionBackground: '#444444',
      },
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
    const prompt = '\r\x1b[1;32m$\x1b[0m ';

    term.onKey(({ key, domEvent }) => {
      if (executingRef.current && domEvent.key === 'Escape') {
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
          line = line.slice(0, -1);
          lineRef.current = line;
          term.write('\b \b');
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
        term.write(prompt + line);
      } else if (domEvent.key === 'ArrowUp') {
        const prev = navigateHistory('back');
        if (prev !== undefined) {
          term.write('\r\x1b[K' + prompt + prev);
          line = prev;
          lineRef.current = prev;
        }
      } else if (domEvent.key === 'ArrowDown') {
        const next = navigateHistory('forward');
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
      } else if (domEvent.key.length === 1 && !executingRef.current) {
        line += key;
        lineRef.current = line;
        term.write(key);
      }
    });

    term.attachCustomKeyEventHandler((e) => {
      if (e.type === 'keydown' && e.key === 'Tab') {
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
  }, [runCommand, navigateHistory]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Mirage terminal"
      role="terminal"
    />
  );
}
