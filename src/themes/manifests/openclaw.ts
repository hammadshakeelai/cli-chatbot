import type { ThemeSkin } from '../registry';

export const openclawSkin: ThemeSkin = {
  id: 'openclaw',
  label: 'OpenClaw',
  description: 'Feral hacker terminal with orange aggression',
  palette: {
    dark: {
      bg: '#0d0d0d',
      fg: '#e0e0e0',
      accent: '#ff6b35',
      accent2: '#ff4500',
      border: '#ff6b3533',
      fgDim: '#888',
      success: '#44cc44',
      warning: '#ffaa00',
      error: '#ff3333',
      selectionBg: '#ff6b3544',
    },
    light: {
      bg: '#fafafa',
      fg: '#1a1a1a',
      accent: '#ff6b35',
      accent2: '#cc4400',
      border: '#ff6b3533',
      fgDim: '#666',
      success: '#228822',
      warning: '#cc8800',
      error: '#cc2222',
      selectionBg: '#ff6b3522',
    },
  },
  xtermTheme: {
    dark: {
      background: '#0d0d0d',
      foreground: '#e0e0e0',
      cursor: '#ff6b35',
      cursorAccent: '#0d0d0d',
      selectionBackground: '#ff6b3544',
      black: '#0d0d0d',
      red: '#ff3333',
      green: '#44cc44',
      yellow: '#ffaa00',
      blue: '#3399ff',
      magenta: '#ff6b35',
      cyan: '#33cccc',
      white: '#e0e0e0',
      brightBlack: '#555',
      brightRed: '#ff5555',
      brightGreen: '#66ee66',
      brightYellow: '#ffbb33',
      brightBlue: '#55aaff',
      brightMagenta: '#ff8c5a',
      brightCyan: '#55dddd',
      brightWhite: '#ffffff',
    },
    light: {
      background: '#fafafa',
      foreground: '#1a1a1a',
      cursor: '#ff6b35',
      cursorAccent: '#ffffff',
      selectionBackground: '#ff6b3522',
      black: '#1a1a1a',
      red: '#cc2222',
      green: '#228822',
      yellow: '#cc8800',
      blue: '#2255cc',
      magenta: '#cc4400',
      cyan: '#228888',
      white: '#e0e0e0',
      brightBlack: '#555',
      brightRed: '#ff5555',
      brightGreen: '#66ee66',
      brightYellow: '#ffbb33',
      brightBlue: '#55aaff',
      brightMagenta: '#ff8c5a',
      brightCyan: '#55dddd',
      brightWhite: '#ffffff',
    },
  },
  fonts: { mono: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace" },
  banner(ctx) {
    const O = '\x1b[38;2;255;107;53m';   // orange
    const R = '\x1b[38;2;255;69;0m';     // red-orange
    const D = '\x1b[38;2;204;55;0m';     // dark orange
    const DIM = '\x1b[2m';
    const BOLD = '\x1b[1m';
    const RST = '\x1b[0m';
    const model = ctx.model || 'auto';

    return [
      '',
      `${O}${BOLD}  ❯ OPENCLAW${RST}`,
      `${D}  ─────────────────────────`,
      `${O}       /\\        /\\`,
      `${R}      <  > <><> <  >`,
      `${D}       \\/        \\/`,
      '',
      `${O}  ⚡ Power-user mode`,
      `${DIM}  model  ${model}`,
      `${DIM}  mode   no-hand-holding`,
      `${D}  ─────────────────────────`,
      `${DIM}  Be precise. No fluff.${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;255;107;53m❯\x1b[0m ',
  fx: { scanlines: true, flicker: false, glow: false, curvature: false },
};
