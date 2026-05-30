import type { ThemeSkin } from '../registry';

export const opencodeSkin: ThemeSkin = {
  id: 'opencode',
  label: 'OpenCode',
  description: 'Clean modern dev TUI',
  palette: {
    dark: {
      'bg': '#0d1117',
      'bg-elev': '#161b22',
      'fg': '#c9d1d9',
      'fg-dim': '#8b949e',
      'accent': '#58a6ff',
      'accent-2': '#79c0ff',
      'border': '#30363d',
      'border-glow': 'rgba(88, 166, 255, 0.2)',
      'selection': '#264f78',
      'cursor': '#c9d1d9',
      'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '6px',
      'scanline-opacity': '0',
      'glow-strength': '0',
    },
    light: {
      'bg': '#ffffff',
      'bg-elev': '#f6f8fa',
      'fg': '#24292f',
      'fg-dim': '#57606a',
      'accent': '#0969da',
      'accent-2': '#218bff',
      'border': '#d0d7de',
      'border-glow': 'rgba(9, 105, 218, 0.2)',
      'selection': '#a8d1ff',
      'cursor': '#24292f',
      'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
      'font-ui': "'Inter', system-ui, sans-serif",
      'radius': '6px',
      'scanline-opacity': '0',
      'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: { background: '#0d1117', foreground: '#c9d1d9', cursor: '#c9d1d9', selectionBackground: '#264f78' },
    light: { background: '#ffffff', foreground: '#24292f', cursor: '#24292f', selectionBackground: '#a8d1ff' },
  },
  fonts: { mono: "'JetBrains Mono', 'Fira Code', monospace" },
  banner(ctx) {
    const B  = '\x1b[38;2;88;166;255m';
    const B2 = '\x1b[38;2;121;192;255m';
    const DIM = '\x1b[2m';
    const BOLD = '\x1b[1m';
    const RST = '\x1b[0m';
    const model = ctx.model || 'auto';
    const cwd = ctx.cwd?.slice(-20) || '/home/user';

    return [
      '',
      `${B}${BOLD}  ◇ opencode${RST}`,
      `${DIM}  ─────────────────────────`,
      `${B}  .───────────────────.`,
      `${B2}  |  </>  code + AI   |`,
      `${B2}  |  > _              |`,
      `${B}  '───────────────────'`,
      '',
      `${DIM}  model  ${model}`,
      `${DIM}  cwd    ${cwd}`,
      `${DIM}  mode   agentic`,
      `${DIM}  ─────────────────────────`,
      `${DIM}  $ _${RST}`,
    ].join('\r\n');
  },
  prompt: '\x1b[38;2;88;166;255m$\x1b[0m ',
};
