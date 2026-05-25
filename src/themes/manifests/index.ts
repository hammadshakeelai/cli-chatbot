import { registerSkin } from '../registry';
import { claudeCodeSkin } from './claude-code';
import { opencodeSkin } from './opencode';
import { classicGreenSkin } from './classic-green';

export function registerAllSkins(): void {
  registerSkin(claudeCodeSkin);
  registerSkin(opencodeSkin);
  registerSkin(classicGreenSkin);
}

export { claudeCodeSkin, opencodeSkin, classicGreenSkin };
