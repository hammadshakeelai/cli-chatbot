import type { ThemeSkin } from '../registry';

export const amberCrtSkin: ThemeSkin = {
  id: 'amber-crt',
  label: 'Amber CRT',
  description: '1980s amber monitor — glow + curvature + flicker',
  palette: {
    dark: {
      'bg': '#1a0f00', 'bg-elev': '#2a1a00', 'fg': '#ffb000', 'fg-dim': '#885500',
      'accent': '#ffcc33', 'accent-2': '#ffdd66', 'border': '#553300', 'border-glow': 'rgba(255,176,0,0.4)',
      'selection': '#332200', 'cursor': '#ffb000', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '4px', 'scanline-opacity': '0.1', 'glow-strength': '0.5',
    },
    light: {
      'bg': '#fff8f0', 'bg-elev': '#fff0e0', 'fg': '#553300', 'fg-dim': '#886644',
      'accent': '#cc8800', 'accent-2': '#ffaa00', 'border': '#ffcc88', 'border-glow': 'rgba(204,136,0,0.2)',
      'selection': '#ffe0bb', 'cursor': '#553300', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '4px', 'scanline-opacity': '0.03', 'glow-strength': '0.2',
    },
  },
  xtermTheme: {
    dark: { background: '#1a0f00', foreground: '#ffb000', cursor: '#ffb000', selectionBackground: '#332200' },
    light: { background: '#fff8f0', foreground: '#553300', cursor: '#553300', selectionBackground: '#ffe0bb' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner() {
    const A  = '\x1b[38;2;255;176;0m';
    const A2 = '\x1b[38;2;255;144;0m';
    const A3 = '\x1b[38;2;200;100;0m';
    const BOLD = '\x1b[1m';
    const DIM = '\x1b[2m';
    const RST = '\x1b[0m';

    return [
      '',
      `${A}${BOLD}  AMBER CRT  ·  1983${RST}`,
      `${A3}  ─────────────────────────`,
      `${A}  .──────────────────.`,
      `${A}  |  >_              |`,
      `${A2}  |  READY.          |`,
      `${A3}  '──────────────────'`,
      `${A3}        | | | | |`,
      `${A3}  ──────++++++++──────`,
      '',
      `${DIM}  640K RAM  ·  40MB HDD`,
      `${DIM}  BASIC 2.0 loaded`,
      `${A3}  ─────────────────────────`,
      `${DIM}  READY.${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;255;176;0m>\x1b[0m ',
  fx: { scanlines: true, glow: true, flicker: true, curvature: true },
};
