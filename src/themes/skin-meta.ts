export interface SkinMeta {
  id: string;
  label: string;
  description: string;
  accent: string;
}

export const ALL_SKIN_META: SkinMeta[] = [
  { id: 'claude-code',   label: 'Claude Code',   description: 'Flagship skin — red border, pixel mascot, model/cwd banner',                  accent: '#e5484d' },
  { id: 'opencode',      label: 'OpenCode',       description: 'Clean modern dev TUI',                                                     accent: '#58a6ff' },
  { id: 'classic-green', label: 'Classic Green',  description: 'VT100 phosphor terminal — amber monitor glow',                             accent: '#33ff33' },
  { id: 'matrix',        label: 'Matrix',          description: 'Digital rain — green-on-black cyberpunk',                                accent: '#00cc44' },
  { id: 'dracula',       label: 'Dracula',         description: 'Dark gothic theme — purple/magenta with green accents',                   accent: '#bd93f9' },
  { id: 'amber-crt',     label: 'Amber CRT',       description: 'Retro amber monitor — warm orange phosphor glow with scanlines',          accent: '#ffb000' },
  { id: 'synthwave',     label: 'Synthwave',       description: 'Neon 80s retro grid — hot pink, cyan, and electric yellow',               accent: '#ff00ff' },
  { id: 'dos',           label: 'DOS',             description: 'Classic PC boot-up — VGA text mode with hardware nostalgia',              accent: '#aaaaaa' },
  { id: 'hacker',        label: 'Hacker',           description: 'Movie hacker terminal — green-on-black with matrix vibes',                accent: '#00ff41' },
  { id: 'high-contrast', label: 'High Contrast',   description: 'Accessibility-first — bold white on black, max readability',              accent: '#ffffff' },
  { id: 'openclaw',      label: 'OpenClaw',         description: 'Dark sleek — vibrant accent, minimal chrome, power-user focus',          accent: '#f97316' },
  { id: 'cursor',        label: 'Cursor',           description: 'Cursor AI editor-inspired — warm amber/orange tones',                    accent: '#d97706' },
  { id: 'copilot',       label: 'GitHub Copilot',   description: 'GitHub Copilot-inspired — deep purples with electric blue accents',       accent: '#8957e5' },
  { id: 'windsurf',      label: 'Windsurf',         description: 'Windsurf AI IDE-inspired — neon cyan on dark blue',                      accent: '#00e5ff' },
  { id: 'mythos',        label: 'Mythos OS',        description: 'Cyber-security rig — dark red, phase crab, flower sigil',                accent: '#cc2233' },
];

/** Map skin ID → export name in its module file. */
export const SKIN_EXPORT_MAP: Record<string, string> = {
  'claude-code':   'claudeCodeSkin',
  'opencode':      'opencodeSkin',
  'classic-green': 'classicGreenSkin',
  'matrix':        'matrixSkin',
  'dracula':       'draculaSkin',
  'amber-crt':     'amberCrtSkin',
  'synthwave':     'synthwaveSkin',
  'dos':           'dosSkin',
  'hacker':        'hackerSkin',
  'high-contrast': 'highContrastSkin',
  'openclaw':      'openclawSkin',
  'cursor':        'cursorSkin',
  'copilot':       'copilotSkin',
  'windsurf':      'windsurfSkin',
  'mythos':        'mythosSkin',
};
