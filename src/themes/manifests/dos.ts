import type { ThemeSkin } from '../registry';

export const dosSkin: ThemeSkin = {
  id: 'dos',
  label: 'DOS',
  description: 'IBM PC / Norton — blue bg, white text',
  palette: {
    dark: {
      'bg': '#0000a8', 'bg-elev': '#0000c0', 'fg': '#ffffff', 'fg-dim': '#c0c0c0',
      'accent': '#ffffff', 'accent-2': '#ffff00', 'border': '#000080', 'border-glow': 'rgba(255,255,255,0.1)',
      'selection': '#000060', 'cursor': '#ffffff', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0', 'glow-strength': '0',
    },
    light: {
      'bg': '#c0c0c0', 'bg-elev': '#d0d0d0', 'fg': '#000000', 'fg-dim': '#404040',
      'accent': '#0000a8', 'accent-2': '#008000', 'border': '#808080', 'border-glow': 'rgba(0,0,168,0.2)',
      'selection': '#a0a0ff', 'cursor': '#000000', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0', 'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: { background: '#0000a8', foreground: '#ffffff', cursor: '#ffffff', selectionBackground: '#000060',
      black: '#000000', red: '#aa0000', green: '#00aa00', yellow: '#aaaa00', blue: '#0000ff', magenta: '#aa00aa', cyan: '#00aaaa', white: '#ffffff',
    },
    light: { background: '#c0c0c0', foreground: '#000000', cursor: '#000000', selectionBackground: '#a0a0ff' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner: () => '\x1b[1;37mMicrosoft(R) Mirage(TM)\x1b[0m\r\n\x1b[2m(C) Copyright 2026\x1b[0m',
  prompt: 'C:\\> ',
};
