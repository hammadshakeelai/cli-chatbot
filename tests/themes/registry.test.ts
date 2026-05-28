import { describe, it, expect, beforeEach } from 'vitest';
import { registerSkin, getSkin, listSkins, applyTheme } from '@/themes/registry';
import type { ThemeSkin } from '@/themes/registry';

const testSkin: ThemeSkin = {
  id: 'test-skin',
  label: 'Test',
  description: 'Test skin',
  palette: {
    dark: { bg: '#000', fg: '#fff', accent: '#f00', border: '#333', fgDim: '#888', success: '#0f0', warning: '#ff0', error: '#f00', selectionBg: '#444' },
    light: { bg: '#fff', fg: '#000', accent: '#c00', border: '#ccc', fgDim: '#666', success: '#080', warning: '#aa0', error: '#c00', selectionBg: '#ddd' },
  },
  xtermTheme: {
    dark: { background: '#000', foreground: '#fff', cursor: '#fff', cursorAccent: '#000', selectionBackground: '#444', black: '#000', red: '#f00', green: '#0f0', yellow: '#ff0', blue: '#00f', magenta: '#f0f', cyan: '#0ff', white: '#fff', brightBlack: '#888', brightRed: '#f44', brightGreen: '#4f4', brightYellow: '#ff4', brightBlue: '#44f', brightMagenta: '#f4f', brightCyan: '#4ff', brightWhite: '#fff' },
    light: { background: '#fff', foreground: '#000', cursor: '#000', cursorAccent: '#fff', selectionBackground: '#ddd', black: '#000', red: '#c00', green: '#080', yellow: '#aa0', blue: '#00c', magenta: '#c0c', cyan: '#088', white: '#fff', brightBlack: '#888', brightRed: '#e44', brightGreen: '#4a4', brightYellow: '#cc0', brightBlue: '#44c', brightMagenta: '#e4e', brightCyan: '#4aa', brightWhite: '#fff' },
  },
  fonts: { mono: 'monospace' },
  banner: () => 'test banner',
  prompt: '$ ',
};

describe('theme registry', () => {
  beforeEach(() => {
    // Clear registry by registering a known set
    registerSkin(testSkin);
  });

  it('registers and retrieves a skin', () => {
    const skin = getSkin('test-skin');
    expect(skin).toBeDefined();
    expect(skin!.id).toBe('test-skin');
  });

  it('returns undefined for unknown skin', () => {
    const skin = getSkin('nonexistent');
    expect(skin).toBeUndefined();
  });

  it('lists all registered skins', () => {
    const list = listSkins();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((s) => s.id === 'test-skin')).toBe(true);
  });

  it('applyTheme does not throw', () => {
    expect(() => applyTheme(testSkin, 'dark')).not.toThrow();
    expect(() => applyTheme(testSkin, 'light')).not.toThrow();
  });
});
