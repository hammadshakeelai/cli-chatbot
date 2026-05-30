import type { ThemeSkin } from '../registry';

export const highContrastSkin: ThemeSkin = {
  id: 'high-contrast',
  label: 'High Contrast',
  description: 'Maximum contrast — WCAG AAA compliant',
  palette: {
    dark: {
      'bg': '#000000', 'bg-elev': '#111111', 'fg': '#ffffff', 'fg-dim': '#cccccc',
      'accent': '#ffff00', 'accent-2': '#ff6600', 'border': '#ffffff', 'border-glow': 'rgba(255,255,255,0.2)',
      'selection': '#333333', 'cursor': '#ffffff', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '4px', 'scanline-opacity': '0', 'glow-strength': '0',
    },
    light: {
      'bg': '#ffffff', 'bg-elev': '#f0f0f0', 'fg': '#000000', 'fg-dim': '#333333',
      'accent': '#0000ff', 'accent-2': '#cc0000', 'border': '#000000', 'border-glow': 'rgba(0,0,0,0.1)',
      'selection': '#ccccff', 'cursor': '#000000', 'font-mono': "'JetBrains Mono', monospace",
      'font-ui': "'Inter', system-ui, sans-serif", 'radius': '4px', 'scanline-opacity': '0', 'glow-strength': '0',
    },
  },
  xtermTheme: {
    dark: { background: '#000000', foreground: '#ffffff', cursor: '#ffffff', selectionBackground: '#333333' },
    light: { background: '#ffffff', foreground: '#000000', cursor: '#000000', selectionBackground: '#ccccff' },
  },
  fonts: { mono: "'JetBrains Mono', monospace" },
  banner() {
    return [
      '',
      '  === HIGH CONTRAST ===',
      '  ######################',
      '  #                    #',
      '  #   WCAG AAA  A11Y   #',
      '  #   maximum clarity  #',
      '  #                    #',
      '  ######################',
      '',
      '  [STATUS] Ready',
      '  [MODE]   Accessibility-first',
      '  [FONT]   JetBrains Mono',
      '  ######################',
      '  Type a command or question.',
    ].join('\r\n');
  },
  prompt: '> ',
};
