import type { ThemeSkin } from '../registry';

export const draculaSkin: ThemeSkin = {
  id: 'dracula',
  label: 'Dracula',
  description: 'Popular dark purple/pink theme',
  palette: {
    dark: {
      'bg': '#282a36', 'bg-elev': '#343746', 'fg': '#f8f8f2', 'fg-dim': '#6272a4',
      'accent': '#bd93f9', 'accent-2': '#ff79c6', 'border': '#44475a', 'border-glow': 'rgba(189,147,249,0.3)',
      'selection': '#44475a', 'cursor': '#f8f8f2', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '8px', 'scanline-opacity': '0', 'glow-strength': '0',
    },
    light: {
      'bg': '#f8f8f2', 'bg-elev': '#ffffff', 'fg': '#282a36', 'fg-dim': '#6272a4',
      'accent': '#bd93f9', 'accent-2': '#ff79c6', 'border': '#d0d0d0', 'border-glow': 'rgba(189,147,249,0.2)',
      'selection': '#e0d0f0', 'cursor': '#282a36', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '8px', 'scanline-opacity': '0', 'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: { background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', selectionBackground: '#44475a' },
    light: { background: '#f8f8f2', foreground: '#282a36', cursor: '#282a36', selectionBackground: '#e0d0f0' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner() {
    const P  = '\x1b[38;2;189;147;249m';   // purple
    const PK = '\x1b[38;2;255;121;198m';   // pink
    const GR = '\x1b[38;2;80;250;123m';    // green
    const CY = '\x1b[38;2;139;233;253m';   // cyan
    const BOLD = '\x1b[1m';
    const DIM = '\x1b[2m';
    const RST = '\x1b[0m';

    return [
      '',
      `${P}${BOLD}  ✦ DRACULA ✦${RST}`,
      `${DIM}  ─────────────────────────`,
      `${PK}  ^v^             ^v^`,
      `${PK}  (  @         @  )`,
      `${P}   |    _____    |`,
      `${GR}   |   /     \\   |`,
      `${P}    \`-----------'`,
      '',
      `${CY}  darkness: maximum`,
      `${PK}  vibes: immaculate`,
      `${DIM}  theme: dracula classic`,
      `${DIM}  ─────────────────────────`,
      `${DIM}  The night is yours.${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;189;147;249m✦\x1b[0m ',
};
