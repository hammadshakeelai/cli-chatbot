import type { ThemeSkin } from '../registry';

export const hackerSkin: ThemeSkin = {
  id: 'hacker',
  label: 'Hacker',
  description: 'Movie hacker — bright green, heavy glow',
  palette: {
    dark: {
      'bg': '#000500', 'bg-elev': '#001000', 'fg': '#00ff00', 'fg-dim': '#007700',
      'accent': '#33ff33', 'accent-2': '#66ff66', 'border': '#004400', 'border-glow': 'rgba(0,255,0,0.5)',
      'selection': '#002200', 'cursor': '#00ff00', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0.08', 'glow-strength': '0.7',
    },
    light: {
      'bg': '#e0ffe0', 'bg-elev': '#f0fff0', 'fg': '#002200', 'fg-dim': '#005500',
      'accent': '#00aa00', 'accent-2': '#33cc33', 'border': '#00cc00', 'border-glow': 'rgba(0,170,0,0.2)',
      'selection': '#aaffaa', 'cursor': '#002200', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '0', 'scanline-opacity': '0.03', 'glow-strength': '0.3',
    },
  },
  xtermTheme: {
    dark: { background: '#000500', foreground: '#00ff00', cursor: '#00ff00', selectionBackground: '#002200' },
    light: { background: '#e0ffe0', foreground: '#002200', cursor: '#002200', selectionBackground: '#aaffaa' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner(ctx) {
    const G = '\x1b[38;2;0;255;0m';
    const G2 = '\x1b[38;2;51;255;51m';
    const G3 = '\x1b[38;2;102;255;102m';
    const DIM = '\x1b[2m';
    const BOLD = '\x1b[1m';
    const RST = '\x1b[0m';
    const ip = '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);

    return [
      '',
      `${G}${BOLD}  // HACKER TERMINAL //${RST}`,
      `${DIM}  ─────────────────────────`,
      `${G2}      .-----------.`,
      `${G2}     (  O       O  )`,
      `${G3}      |   _____  |`,
      `${G3}      |  |     | |`,
      `${G2}       \`----------'`,
      '',
      `${G}  [+] Session started`,
      `${G}  [+] IP: ${ip}`,
      `${DIM}  [*] Target: ${ctx.cwd || '/root'}`,
      `${DIM}  ─────────────────────────`,
      `${DIM}  root@hacker:~# _${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;0;255;0mroot@hacker\x1b[38;2;51;255;51m:~\x1b[0m# ',
  fx: { glow: true, scanlines: true },
};
