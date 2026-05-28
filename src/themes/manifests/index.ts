import { registerSkin } from '../registry';
import type { ThemeSkin } from '../registry';
import { claudeCodeSkin } from './claude-code';
import { SKIN_EXPORT_MAP } from '../skin-meta';

// Default skin — always statically imported since it's shown on first load
export { claudeCodeSkin };

/**
 * Dynamically import a skin module by ID, register it, and return the skin.
 * Each skin file becomes its own webpack chunk, loaded on demand.
 */
export async function loadSkin(id: string): Promise<ThemeSkin> {
  const { getSkin } = await import('../registry');
  const existing = getSkin(id);
  if (existing) return existing;

  const exportName = SKIN_EXPORT_MAP[id];
  if (!exportName) throw new Error(`Unknown skin: ${id}`);

  // Dynamic import — webpack will create a separate chunk per skin file
  const mod = await import(/* webpackChunkName: "skin-[request]" */ `./${id}`);
  const skin = (mod as Record<string, ThemeSkin>)[exportName];
  if (!skin) throw new Error(`Skin module ${id} missing export ${exportName}`);
  registerSkin(skin);
  return skin;
}
