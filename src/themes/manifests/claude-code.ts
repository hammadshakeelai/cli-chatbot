import type { ThemeSkin } from '../registry';

export const claudeCodeSkin: ThemeSkin = {
  id: 'claude-code',
  label: 'Claude Code',
  description: 'Flagship skin — red border, pixel mascot, model/cwd banner',
  palette: {
    dark: {
      'bg': '#0a0a0a',
      'bg-elev': '#1a1a1a',
      'fg': '#e0e0e0',
      'fg-dim': '#888888',
      'accent': '#e5484d',
      'accent-2': '#ff6b70',
      'border': '#e5484d',
      'border-glow': 'rgba(229, 72, 77, 0.3)',
      'selection': '#444444',
      'cursor': '#e0e0e0',
      'font-mono': "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '12px',
      'scanline-opacity': '0',
      'glow-strength': '0',
    },
    light: {
      'bg': '#fafaf8',
      'bg-elev': '#ffffff',
      'fg': '#1a1a1a',
      'fg-dim': '#888888',
      'accent': '#e5484d',
      'accent-2': '#d03c41',
      'border': '#d0d0c8',
      'border-glow': 'rgba(229, 72, 77, 0.1)',
      'selection': '#dddddd',
      'cursor': '#1a1a1a',
      'font-mono': "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '12px',
      'scanline-opacity': '0',
      'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: {
      background: '#0a0a0a',
      foreground: '#e0e0e0',
      cursor: '#e0e0e0',
      cursorAccent: '#0a0a0a',
      selectionBackground: '#444444',
      black: '#1a1a1a',
      red: '#e5484d',
      green: '#30a46c',
      yellow: '#f5a623',
      blue: '#4da6ff',
      magenta: '#d6409f',
      cyan: '#4dc9b6',
      white: '#e0e0e0',
      brightBlack: '#555555',
      brightRed: '#ff6b70',
      brightGreen: '#56c68a',
      brightYellow: '#ffc857',
      brightBlue: '#7ab8ff',
      brightMagenta: '#e066b0',
      brightCyan: '#6ddbc8',
      brightWhite: '#f0f0f0',
    },
    light: {
      background: '#fafaf8',
      foreground: '#1a1a1a',
      cursor: '#1a1a1a',
      cursorAccent: '#fafaf8',
      selectionBackground: '#dddddd',
      black: '#1a1a1a',
      red: '#e5484d',
      green: '#30a46c',
      yellow: '#b8860b',
      blue: '#2266cc',
      magenta: '#b5307a',
      cyan: '#1a8a7a',
      white: '#c0c0c0',
      brightBlack: '#555555',
      brightRed: '#cc3333',
      brightGreen: '#2d8f5a',
      brightYellow: '#d4921e',
      brightBlue: '#3388ee',
      brightMagenta: '#a02070',
      brightCyan: '#3aa88f',
      brightWhite: '#e0e0e0',
    },
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    ui: "'Inter', system-ui, sans-serif",
  },
  banner(ctx) {
    const R = '\x1b[31m';
    const DIM = '\x1b[2m';
    const RST = '\x1b[0m';
    const BOLD = '\x1b[1m';

    const label = 'Claude Code';
    const W = 59; // interior width between ││, total line = 61

    // Border pieces
    const TOP = `╭${'─'.repeat(23)} ${label} ${'─'.repeat(23)}╮`; // 1+23+1+11+1+23+1 = 61
    const RULER = `├${'─'.repeat(W)}┤`;
    const SIDE = '│';
    const EMPTY = `${R}${SIDE}${RST}${' '.repeat(W)}${R}${SIDE}${RST}`;

    // Helper: center text inside the box.
    // text may contain ANSI codes; visible length is computed by stripping them.
    const centerLine = (text: string) => {
      const visible = text.replace(/\x1b\[[0-9;]*m/g, '');
      const pad = W - visible.length;
      const left = Math.floor(pad / 2);
      const right = Math.ceil(pad / 2);
      return `${R}${SIDE}${RST}${' '.repeat(left)}${text}${' '.repeat(right)}${R}${SIDE}${RST}`;
    };

    // ASCII art — pixel-art pig/creature (blocky, two eyes, little legs)
    // Each line is centered independently so varying widths are fine
    const artLines = [
      '      ░░░░░░░░░',
      '    ░░███████░░',
      '   ░██ ◉   ◉ ██░',
      '   ██   ▄▄▄   ██',
      '   ██   ▀▀▀   ██',
      '   ░██▄▄▄▄▄▄▄██░',
      '    ░░███████░░',
      '      ░███░░',
      '     ▄▄███▄▄',
      '   ▄▄█████████▄▄',
      '  ███████████████',
      '  █ ███████████ █',
      '  █ ███████████ █',
    ];
    const art = artLines.map(line => centerLine(line)).join('\n');

    // Build banner
    const modelDisplay = ctx.model || 'Opus 4.7 (1M context)';

    const lines = [
      `${R}${TOP}${RST}`,
      EMPTY,
      centerLine(`${BOLD}Welcome back!${RST}`),
      EMPTY,
      art,
      EMPTY,
      centerLine(`${DIM}${modelDisplay}${RST}`),
      centerLine(`${DIM}Claude Pro${RST}`),
      centerLine(`${DIM}${ctx.cwd}${RST}`),
      EMPTY,
      `${R}${RULER}${RST}`,
    ];

    return lines.join('\n');
  },
  prompt: '> ',
};
