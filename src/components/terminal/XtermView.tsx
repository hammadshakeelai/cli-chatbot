'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import 'xterm/css/xterm.css';

export function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);

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
      // WebGL unavailable — falls back to canvas renderer
    }

    fitAddon.fit();

    const ro = new ResizeObserver(() => fitAddon.fit());
    ro.observe(container);

    // --- Echo shell ---
    let line = '';
    const prompt = '\r$ ';

    term.onKey(({ key, domEvent }) => {
      if (domEvent.key === 'Enter') {
        term.writeln(`\r$ ${line}`);
        line = '';
        term.write(prompt);
      } else if (domEvent.key === 'Backspace') {
        if (line.length > 0) {
          line = line.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
        term.write(prompt);
      } else if (domEvent.key.length === 1) {
        line += key;
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
    term.writeln('Type a command and press Enter.\r\n');
    term.write(prompt);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Mirage terminal"
      role="terminal"
    />
  );
}
