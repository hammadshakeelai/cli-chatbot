import type { ThemeSkin } from '../registry';

export const classicGreenSkin: ThemeSkin = {
  id: 'classic-green',
  label: 'Classic Green',
  description: 'VT100 phosphor terminal',
  palette: {
    dark: {
      'bg': '#001a00',
      'bg-elev': '#002200',
      'fg': '#00ff00',
      'fg-dim': '#008800',
      'accent': '#00cc00',
      'accent-2': '#33ff33',
      'border': '#004400',
      'border-glow': 'rgba(0, 255, 0, 0.1)',
      'selection': '#003300',
      'cursor': '#00ff00',
      'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '0',
      'scanline-opacity': '0.08',
      'glow-strength': '0',
    },
    light: {
      'bg': '#f0fff0',
      'bg-elev': '#e0ffe0',
      'fg': '#003300',
      'fg-dim': '#006600',
      'accent': '#008800',
      'accent-2': '#00aa00',
      'border': '#00cc00',
      'border-glow': 'rgba(0, 136, 0, 0.1)',
      'selection': '#bbffbb',
      'cursor': '#003300',
      'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '0',
      'scanline-opacity': '0.03',
      'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: { background: '#001a00', foreground: '#00ff00', cursor: '#00ff00', selectionBackground: '#003300' },
    light: { background: '#f0fff0', foreground: '#003300', cursor: '#003300', selectionBackground: '#bbffbb' },
  },
  fonts: { mono: "'JetBrains Mono', 'Fira Code', monospace" },
  banner(ctx) {
    const G  = '\x1b[38;2;0;255;0m';
    const G2 = '\x1b[38;2;0;200;0m';
    const G3 = '\x1b[38;2;0;150;0m';
    const BOLD = '\x1b[1m';
    const DIM = '\x1b[2m';
    const RST = '\x1b[0m';
    const host = 'vt100';
    const user = 'user';

    return [
      '',
      `${G}${BOLD}  DEC VT100  ·  1978${RST}`,
      `${G3}  ─────────────────────────`,
      `${G}  +────────────────────+`,
      `${G2}  |  VT100 terminal    |`,
      `${G2}  |  UNIX v7  ·  PDP11 |`,
      `${G2}  |  ${DIM}${ctx.cwd?.slice(-14) || '/home/user'}${RST}${G2}  |`,
      `${G3}  +────────────────────+`,
      '',
      `${DIM}  login: ${user}@${host}`,
      `${DIM}  Last login: today`,
      `${G3}  ─────────────────────────`,
      `${DIM}  ${user}@${host}:~%${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;0;200;0muser@vt100\x1b[38;2;0;150;0m:~\x1b[0m% ',
  fx: { scanlines: true },
};
