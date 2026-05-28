import type { ThemeSkin } from '../registry';

export const synthwaveSkin: ThemeSkin = {
  id: 'synthwave',
  label: 'Synthwave',
  description: 'Neon 80s — magenta/cyan, strong glow',
  palette: {
    dark: {
      'bg': '#0a0015', 'bg-elev': '#150020', 'fg': '#e0c0ff', 'fg-dim': '#8040a0',
      'accent': '#ff00ff', 'accent-2': '#00ffff', 'border': '#400060', 'border-glow': 'rgba(255,0,255,0.3)',
      'selection': '#300050', 'cursor': '#00ffff', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0', 'glow-strength': '0.6',
    },
    light: {
      'bg': '#f5f0ff', 'bg-elev': '#ffffff', 'fg': '#1a0020', 'fg-dim': '#604080',
      'accent': '#cc00cc', 'accent-2': '#00aaaa', 'border': '#d0c0e0', 'border-glow': 'rgba(204,0,204,0.2)',
      'selection': '#e0d0f0', 'cursor': '#1a0020', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0', 'glow-strength': '0.3',
    },
  },
  xtermTheme: {
    dark: { background: '#0a0015', foreground: '#e0c0ff', cursor: '#00ffff', selectionBackground: '#300050' },
    light: { background: '#f5f0ff', foreground: '#1a0020', cursor: '#1a0020', selectionBackground: '#e0d0f0' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner: () => [
    '\x1b[38;2;255;0;255m  ╔═╗╦╔╗╔╦╔╗╔╔═╗╦ ╦╔═╗╦═╗',
    '\x1b[38;2;255;0;128m  ║ ╦║║║║║║║║║╣ ║ ║║╣ ╠╦╝',
    '\x1b[38;2;0;255;255m  ╚═╝╩╝╚╝╩╝╚╝╚═╝╚═╝╚═╝╩╚═',
    '\x1b[38;2;255;0;255m  ── neon 80s  ──  \x1b[38;2;255;255;0m16k ──',
  ].join('\n'),
  prompt: '❯ ',
  fx: { glow: true },
};
