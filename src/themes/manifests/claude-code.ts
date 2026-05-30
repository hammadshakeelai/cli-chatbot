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
    const R = '\x1b[38;2;229;72;77m';
    const DIM = '\x1b[2m';
    const RST = '\x1b[0m';
    const BOLD = '\x1b[1m';
    const W = 32; // mobile-friendly interior width, total line = 34

    const label = 'Claude Code';
    const TOP = `${R}╭─ ${label} ${'─'.repeat(W - label.length - 3)}╮${RST}`;
    const RULER = `${R}├${'─'.repeat(W)}┤${RST}`;

    const pad = (text: string) => {
      const vis = text.replace(/\x1b\[[0-9;]*m/g, '');
      const p = W - vis.length;
      const l = Math.floor(p / 2);
      const r = Math.ceil(p / 2);
      return `${R}│${RST}${' '.repeat(l)}${text}${' '.repeat(r)}${R}│${RST}`;
    };
    const empty = `${R}│${RST}${' '.repeat(W)}${R}│${RST}`;

    // Clawd — authentic Claude Code block-pixel mascot
    const mascot = [
      '    ▄▄▄▄▄▄▄',
      '   ▐▛███████▜▌',
      '   ▐█ ▀   ▀ █▌',
      '   ▐█  ───  █▌',
      '   ▐▙███████▟▌',
      '    ▀▀▀▀▀▀▀▀▀',
    ].map(pad).join('\n');

    const model = ctx.model || 'auto · gemini → groq → grok';
    const cwd = ctx.cwd.length > W - 2 ? '…' + ctx.cwd.slice(-(W - 3)) : ctx.cwd;

    return [
      TOP,
      empty,
      pad(`${BOLD}Agentic AI Terminal${RST}`),
      empty,
      mascot,
      empty,
      pad(`${DIM}${model}${RST}`),
      pad(`${DIM}${cwd}${RST}`),
      empty,
      RULER,
    ].join('\n');
  },
  prompt: '> ',
};
