import { getScheme } from './schemes';
import type { SchemeVariant } from './schemes';
import { FONT_MONO, FONT_UI } from '@/lib/constants';

export type Mode = 'dark' | 'light';

export function variantOf(schemeId: string, mode: Mode): SchemeVariant {
  const scheme = getScheme(schemeId);
  return mode === 'dark' ? scheme.dark : scheme.light;
}

/** Push scheme colors into CSS custom properties on :root. */
export function applyChrome(schemeId: string, mode: Mode): void {
  if (typeof document === 'undefined') return;
  const v = variantOf(schemeId, mode);
  const root = document.documentElement;
  const set = (k: string, val: string) => root.style.setProperty(k, val);
  set('--bg', v.bg);
  set('--titlebar', v.titlebar);
  set('--surface', v.surface);
  set('--hover', v.hover);
  set('--fg', v.fg);
  set('--fg-dim', v.fgDim);
  set('--border', v.border);
  set('--accent', v.accent);
  set('--font-mono', FONT_MONO);
  set('--font-ui', FONT_UI);
  root.setAttribute('data-scheme', schemeId);
  root.setAttribute('data-mode', mode);
}
