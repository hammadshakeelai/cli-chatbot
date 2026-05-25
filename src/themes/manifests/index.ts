import { registerSkin } from '../registry';
import { claudeCodeSkin } from './claude-code';
import { opencodeSkin } from './opencode';
import { classicGreenSkin } from './classic-green';
import { matrixSkin } from './matrix';
import { draculaSkin } from './dracula';
import { amberCrtSkin } from './amber-crt';
import { synthwaveSkin } from './synthwave';
import { dosSkin } from './dos';
import { hackerSkin } from './hacker';
import { highContrastSkin } from './high-contrast';

export function registerAllSkins(): void {
  registerSkin(claudeCodeSkin);
  registerSkin(opencodeSkin);
  registerSkin(classicGreenSkin);
  registerSkin(matrixSkin);
  registerSkin(draculaSkin);
  registerSkin(amberCrtSkin);
  registerSkin(synthwaveSkin);
  registerSkin(dosSkin);
  registerSkin(hackerSkin);
  registerSkin(highContrastSkin);
}

export {
  claudeCodeSkin, opencodeSkin, classicGreenSkin, matrixSkin,
  draculaSkin, amberCrtSkin, synthwaveSkin, dosSkin, hackerSkin,
  highContrastSkin,
};
