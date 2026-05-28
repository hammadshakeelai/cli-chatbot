import type { ThemeSkin } from '../registry';

export const matrixSkin: ThemeSkin = {
  id: 'matrix',
  label: 'Matrix',
  description: 'Digital rain — green on black',
  palette: {
    dark: {
      'bg': '#000a00', 'bg-elev': '#001500', 'fg': '#00ff41', 'fg-dim': '#008a22',
      'accent': '#00ff41', 'accent-2': '#33ff77', 'border': '#003d11', 'border-glow': 'rgba(0,255,65,0.2)',
      'selection': '#003d11', 'cursor': '#00ff41', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0.05', 'glow-strength': '0.3',
    },
    light: {
      'bg': '#f0fff0', 'bg-elev': '#e0ffe0', 'fg': '#003311', 'fg-dim': '#006622',
      'accent': '#00aa33', 'accent-2': '#00cc44', 'border': '#00cc44', 'border-glow': 'rgba(0,170,51,0.15)',
      'selection': '#bbffbb', 'cursor': '#003311', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0.02', 'glow-strength': '0.1',
    },
  },
  xtermTheme: {
    dark: { background: '#000a00', foreground: '#00ff41', cursor: '#00ff41', selectionBackground: '#003d11' },
    light: { background: '#f0fff0', foreground: '#003311', cursor: '#003311', selectionBackground: '#bbffbb' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner: () => [
    '\x1b[38;2;0;255;65m  ╦ ╦╔═╗╦═╗╔╦╗╔═╗╦═╗',
    '\x1b[38;2;0;200;50m  ║ ║╠═╣╠╦╝ ║║║╣ ╠╦╝',
    '\x1b[38;2;0;138;34m  ╚═╝╩ ╩╩╚══╩╝╚═╝╩╚═',
    '\x1b[38;2;0;255;65m  ── wake up, Neo ──',
  ].join('\n'),
  prompt: '> ',
  fx: { glow: true },
};
