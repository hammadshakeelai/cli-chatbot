/**
 * Color schemes — global look of chrome + terminals.
 * Agents do NOT retheme the terminal (real CLIs inherit your colors);
 * they only bring their own ANSI accents.
 */

export interface XtermColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string; red: string; green: string; yellow: string;
  blue: string; magenta: string; cyan: string; white: string;
  brightBlack: string; brightRed: string; brightGreen: string; brightYellow: string;
  brightBlue: string; brightMagenta: string; brightCyan: string; brightWhite: string;
}

export interface SchemeVariant {
  /** Chrome CSS variables. */
  bg: string;       // terminal pane background (matches xterm background)
  titlebar: string; // title bar background
  surface: string;  // dropdowns / dialogs
  hover: string;    // hover overlays
  fg: string;
  fgDim: string;
  border: string;
  accent: string;
  xterm: XtermColors;
}

export interface ColorScheme {
  id: string;
  label: string;
  description: string;
  dark: SchemeVariant;
  light: SchemeVariant;
}

function ansi(
  bg: string, fg: string, cursor: string, selection: string,
  colors: [string, string, string, string, string, string, string, string,
           string, string, string, string, string, string, string, string],
): XtermColors {
  return {
    background: bg, foreground: fg, cursor, cursorAccent: bg, selectionBackground: selection,
    black: colors[0], red: colors[1], green: colors[2], yellow: colors[3],
    blue: colors[4], magenta: colors[5], cyan: colors[6], white: colors[7],
    brightBlack: colors[8], brightRed: colors[9], brightGreen: colors[10], brightYellow: colors[11],
    brightBlue: colors[12], brightMagenta: colors[13], brightCyan: colors[14], brightWhite: colors[15],
  };
}

/** Windows Terminal "Campbell" — the authentic default. */
const campbellDark: SchemeVariant = {
  bg: '#0c0c0c', titlebar: '#1c1c1c', surface: '#252525', hover: 'rgba(255,255,255,0.06)',
  fg: '#cccccc', fgDim: '#8a8a8a', border: '#3b3b3b', accent: '#4cc2ff',
  xterm: ansi('#0c0c0c', '#cccccc', '#cccccc', 'rgba(255,255,255,0.25)', [
    '#0c0c0c', '#c50f1f', '#13a10e', '#c19c00', '#0037da', '#881798', '#3a96dd', '#cccccc',
    '#767676', '#e74856', '#16c60c', '#f9f1a5', '#3b78ff', '#b4009e', '#61d6d6', '#f2f2f2',
  ]),
};

const campbellLight: SchemeVariant = {
  bg: '#fafafa', titlebar: '#e8e8e8', surface: '#ffffff', hover: 'rgba(0,0,0,0.05)',
  fg: '#383a42', fgDim: '#8c8f98', border: '#d4d4d4', accent: '#005fb8',
  xterm: ansi('#fafafa', '#383a42', '#383a42', 'rgba(0,0,0,0.15)', [
    '#3c3c3c', '#c50f1f', '#107c10', '#9d5d00', '#0037da', '#881798', '#0e7490', '#6b6b6b',
    '#8a8a8a', '#e74856', '#16a316', '#bf8f00', '#3b78ff', '#b4009e', '#0891b2', '#1a1a1a',
  ]),
};

export const SCHEMES: ColorScheme[] = [
  {
    id: 'campbell', label: 'Campbell', description: 'Windows Terminal default',
    dark: campbellDark, light: campbellLight,
  },
  {
    id: 'one-half-dark', label: 'One Half Dark', description: 'Soft modern editor palette',
    dark: {
      bg: '#282c34', titlebar: '#21252b', surface: '#2c313a', hover: 'rgba(255,255,255,0.06)',
      fg: '#dcdfe4', fgDim: '#9097a2', border: '#3e4451', accent: '#61afef',
      xterm: ansi('#282c34', '#dcdfe4', '#dcdfe4', 'rgba(151,166,198,0.3)', [
        '#282c34', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#dcdfe4',
        '#5d677a', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#ffffff',
      ]),
    },
    light: {
      bg: '#fafafa', titlebar: '#eaeaeb', surface: '#ffffff', hover: 'rgba(0,0,0,0.05)',
      fg: '#383a42', fgDim: '#8c8f98', border: '#d4d4d8', accent: '#0184bc',
      xterm: ansi('#fafafa', '#383a42', '#383a42', 'rgba(0,0,0,0.15)', [
        '#383a42', '#e45649', '#50a14f', '#c18401', '#0184bc', '#a626a4', '#0997b3', '#909198',
        '#6b6c75', '#e45649', '#50a14f', '#c18401', '#0184bc', '#a626a4', '#0997b3', '#1a1a1c',
      ]),
    },
  },
  {
    id: 'dracula', label: 'Dracula', description: 'The classic purple night theme',
    dark: {
      bg: '#282a36', titlebar: '#1e2029', surface: '#2f3241', hover: 'rgba(255,255,255,0.06)',
      fg: '#f8f8f2', fgDim: '#8b90a8', border: '#44475a', accent: '#bd93f9',
      xterm: ansi('#282a36', '#f8f8f2', '#f8f8f2', 'rgba(68,71,90,0.85)', [
        '#21222c', '#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#f8f8f2',
        '#6272a4', '#ff6e6e', '#69ff94', '#ffffa5', '#d6acff', '#ff92df', '#a4ffff', '#ffffff',
      ]),
    },
    light: {
      bg: '#f8f8f2', titlebar: '#e8e8e2', surface: '#ffffff', hover: 'rgba(0,0,0,0.05)',
      fg: '#282a36', fgDim: '#8a8c99', border: '#d8d8d2', accent: '#9554e8',
      xterm: ansi('#f8f8f2', '#282a36', '#282a36', 'rgba(0,0,0,0.15)', [
        '#21222c', '#d63131', '#1a9e3c', '#9d7d00', '#9554e8', '#d6409f', '#0e7490', '#6b6b76',
        '#6272a4', '#ff5555', '#27ae44', '#b8950a', '#bd93f9', '#ff79c6', '#0891b2', '#1a1a24',
      ]),
    },
  },
  {
    id: 'matrix', label: 'Matrix', description: 'Green digital rain',
    dark: {
      bg: '#050a05', titlebar: '#0a140a', surface: '#0c1a0c', hover: 'rgba(0,255,65,0.07)',
      fg: '#aaffaa', fgDim: '#3f8c3f', border: '#1b4d1b', accent: '#00ff41',
      xterm: ansi('#050a05', '#9dff9d', '#00ff41', 'rgba(0,255,65,0.25)', [
        '#0a140a', '#cc3333', '#00cc44', '#aacc33', '#33aa88', '#7755cc', '#33ccaa', '#9dff9d',
        '#2d662d', '#ff5555', '#00ff41', '#ccff66', '#55ccaa', '#9977ee', '#66ffcc', '#d8ffd8',
      ]),
    },
    light: {
      bg: '#eef7ee', titlebar: '#dcecdc', surface: '#ffffff', hover: 'rgba(0,100,30,0.06)',
      fg: '#0c3a14', fgDim: '#5d8a66', border: '#bcd8bc', accent: '#008f2b',
      xterm: ansi('#eef7ee', '#0c3a14', '#0c3a14', 'rgba(0,140,40,0.18)', [
        '#123a16', '#bb2222', '#008f2b', '#7d8a00', '#1a7a5e', '#6644aa', '#0e8a72', '#4d6b52',
        '#3e6644', '#dd3333', '#00a833', '#9aa800', '#27a37e', '#8866cc', '#13ab8e', '#06250c',
      ]),
    },
  },
  {
    id: 'classic-green', label: 'Classic Green', description: 'VT220 phosphor monochrome',
    dark: {
      bg: '#021202', titlebar: '#041e04', surface: '#062506', hover: 'rgba(51,255,51,0.07)',
      fg: '#33ff33', fgDim: '#1d8c1d', border: '#114411', accent: '#33ff33',
      xterm: ansi('#021202', '#33ff33', '#33ff33', 'rgba(51,255,51,0.25)', [
        '#062506', '#2dbb2d', '#33ff33', '#66ff66', '#22aa22', '#44cc44', '#33dd77', '#33ff33',
        '#1d8c1d', '#55ff55', '#66ff66', '#99ff99', '#44cc44', '#66dd66', '#55ffaa', '#ccffcc',
      ]),
    },
    light: {
      bg: '#f0fcf0', titlebar: '#ddf2dd', surface: '#ffffff', hover: 'rgba(0,120,0,0.06)',
      fg: '#0a4d0a', fgDim: '#578a57', border: '#bcdcbc', accent: '#0f7d0f',
      xterm: ansi('#f0fcf0', '#0a4d0a', '#0a4d0a', 'rgba(20,140,20,0.18)', [
        '#0a4d0a', '#8a5d0a', '#0f7d0f', '#4d7d0a', '#0f6d3d', '#3d7d3d', '#0f7d5d', '#3d663d',
        '#3d7d3d', '#a87d1a', '#1a9e1a', '#6b9e1a', '#1a8e55', '#55a855', '#1a9e7d', '#042d04',
      ]),
    },
  },
  {
    id: 'amber-crt', label: 'Amber CRT', description: 'Warm 1983 phosphor glow',
    dark: {
      bg: '#100a00', titlebar: '#1d1300', surface: '#241800', hover: 'rgba(255,176,0,0.08)',
      fg: '#ffb000', fgDim: '#9c6d00', border: '#4d3600', accent: '#ffb000',
      xterm: ansi('#100a00', '#ffb000', '#ffb000', 'rgba(255,176,0,0.25)', [
        '#241800', '#e06000', '#caa000', '#ffd000', '#b08000', '#d09030', '#e8b860', '#ffb000',
        '#9c6d00', '#ff8030', '#e8c040', '#ffe060', '#caa040', '#ffc060', '#ffd890', '#ffe8c0',
      ]),
    },
    light: {
      bg: '#fdf6e8', titlebar: '#f2e6cc', surface: '#fffdf6', hover: 'rgba(150,100,0,0.07)',
      fg: '#5d3a00', fgDim: '#a07d3d', border: '#e0cda0', accent: '#b87700',
      xterm: ansi('#fdf6e8', '#5d3a00', '#5d3a00', 'rgba(180,120,0,0.18)', [
        '#5d3a00', '#bb4400', '#8a7700', '#b87700', '#8a5d1a', '#a8662a', '#9c8030', '#7d6640',
        '#8a6d3d', '#dd5511', '#a89211', '#d49211', '#a8771f', '#cc8844', '#b89a44', '#3a2500',
      ]),
    },
  },
  {
    id: 'synthwave', label: 'Synthwave', description: 'Neon 1986 — magenta & cyan',
    dark: {
      bg: '#16101e', titlebar: '#1f1530', surface: '#251a38', hover: 'rgba(255,0,255,0.08)',
      fg: '#e8d8ff', fgDim: '#8d77ab', border: '#3d2a5d', accent: '#ff00ff',
      xterm: ansi('#16101e', '#e8d8ff', '#ff00ff', 'rgba(255,0,255,0.25)', [
        '#251a38', '#ff3366', '#33ffcc', '#ffe24c', '#5577ff', '#ff00ff', '#00ffff', '#e8d8ff',
        '#6b5590', '#ff6688', '#66ffd8', '#fff077', '#7799ff', '#ff66ff', '#66ffff', '#fff0ff',
      ]),
    },
    light: {
      bg: '#fbf2ff', titlebar: '#f0dfff', surface: '#ffffff',
      hover: 'rgba(180,0,180,0.06)',
      fg: '#3d1a52', fgDim: '#8f6ba8', border: '#e2c8f2', accent: '#c400c4',
      xterm: ansi('#fbf2ff', '#3d1a52', '#c400c4', 'rgba(196,0,196,0.15)', [
        '#3d1a52', '#d4205d', '#0d9e7e', '#a8851a', '#3d55cc', '#c400c4', '#0891b2', '#7d668f',
        '#6b5580', '#ee3377', '#13b893', '#c29a1f', '#5577ee', '#dd33dd', '#13a8cc', '#250d33',
      ]),
    },
  },
  {
    id: 'mythos', label: 'Mythos', description: 'Dark-red security rig',
    dark: {
      bg: '#0a0505', titlebar: '#140a0a', surface: '#1c0e0e', hover: 'rgba(204,34,51,0.09)',
      fg: '#d4c0c0', fgDim: '#8a5d5d', border: '#3a1818', accent: '#cc2233',
      xterm: ansi('#0a0505', '#d4c0c0', '#cc2233', 'rgba(204,34,51,0.25)', [
        '#140a0a', '#cc2233', '#33aa44', '#ccaa33', '#4466cc', '#cc3366', '#33aaaa', '#d4c0c0',
        '#553333', '#ff4455', '#55dd66', '#ddcc44', '#6688ee', '#ee5588', '#55cccc', '#ffe8e8',
      ]),
    },
    light: {
      bg: '#fdf4f4', titlebar: '#f2dede', surface: '#ffffff', hover: 'rgba(160,20,40,0.06)',
      fg: '#4d1a1a', fgDim: '#a07070', border: '#e8c4c4', accent: '#b81d33',
      xterm: ansi('#fdf4f4', '#4d1a1a', '#b81d33', 'rgba(184,29,51,0.15)', [
        '#4d1a1a', '#b81d33', '#1a8a2d', '#a8851a', '#3d55b8', '#b82d5d', '#178a8a', '#8a6b6b',
        '#7d5555', '#dd3344', '#27a83d', '#c29a1f', '#5577dd', '#dd4477', '#1fa8a8', '#2d0d0d',
      ]),
    },
  },
];

export const DEFAULT_SCHEME_ID = 'campbell';

export function getScheme(id: string): ColorScheme {
  return SCHEMES.find((s) => s.id === id) ?? SCHEMES[0]!;
}
