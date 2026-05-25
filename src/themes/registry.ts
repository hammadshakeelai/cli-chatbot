export interface ThemeSkin {
  id: string;
  label: string;
  description: string;
  palette: {
    dark: Record<string, string>;
    light: Record<string, string>;
  };
  xtermTheme: { dark: Record<string, string>; light: Record<string, string> };
  fonts: { mono: string; ui?: string };
  banner(ctx: { model: string; cwd: string; mode: 'dark' | 'light' }): string;
  prompt: string;
  fx?: { scanlines?: boolean; glow?: boolean; flicker?: boolean; curvature?: boolean };
}

const skins = new Map<string, ThemeSkin>();

export function registerSkin(skin: ThemeSkin): void {
  skins.set(skin.id, skin);
}

export function getSkin(id: string): ThemeSkin | undefined {
  return skins.get(id);
}

export function listSkins(): ThemeSkin[] {
  return Array.from(skins.values());
}

export function applyTheme(skin: ThemeSkin, mode: 'dark' | 'light', term?: any): void {
  const palette = mode === 'dark' ? skin.palette.dark : skin.palette.light;
  const root = document.documentElement;

  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--${key}`, value);
  }

  root.setAttribute('data-skin', skin.id);
  root.setAttribute('data-mode', mode);

  if (term) {
    const xtermTheme = mode === 'dark' ? skin.xtermTheme.dark : skin.xtermTheme.light;
    term.setOption('theme', xtermTheme as any);
    term.setOption('cursorStyle', 'block');
    term.setOption('cursorBlink', false);
  }

  localStorage.setItem('mirage-skin', skin.id);
  localStorage.setItem('mirage-mode', mode);
}
