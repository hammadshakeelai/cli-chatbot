/** ANSI/SGR helpers used across the shell + agents. */

export const ESC = '\x1b';
export const RESET = '\x1b[0m';

export const sgr = {
  reset: RESET,
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  strike: '\x1b[9m',
  noBold: '\x1b[22m',
  noItalic: '\x1b[23m',
  noUnderline: '\x1b[24m',

  black: '\x1b[30m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
  gray: '\x1b[90m', brightRed: '\x1b[91m', brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m', brightBlue: '\x1b[94m', brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m', brightWhite: '\x1b[97m',
  fgDefault: '\x1b[39m',
};

/** 24-bit foreground from hex (#rrggbb). */
export function fgHex(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/** 24-bit background from hex. */
export function bgHex(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `\x1b[48;2;${r};${g};${b}m`;
}

export function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

/** Linear color interpolation between two hex colors, t ∈ [0,1]. */
export function lerpHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[m(ca.r, cb.r), m(ca.g, cb.g), m(ca.b, cb.b)]
    .map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;

export function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

/** Visible cell width of a string (ANSI stripped; wide glyphs counted as 1 — close enough). */
export function visibleWidth(s: string): number {
  return [...stripAnsi(s)].length;
}

/** Apply a horizontal gradient across each line of an ASCII art block. */
export function gradientLines(lines: string[], from: string, to: string): string[] {
  return lines.map((line) => {
    const chars = [...line];
    const n = Math.max(1, chars.length - 1);
    let out = '';
    let lastColor = '';
    chars.forEach((ch, i) => {
      if (ch === ' ') { out += ch; return; }
      const color = fgHex(lerpHex(from, to, i / n));
      if (color !== lastColor) { out += color; lastColor = color; }
      out += ch;
    });
    return out + RESET;
  });
}

/** Apply a vertical gradient (per line) across an ASCII art block. */
export function gradientLinesVertical(lines: string[], from: string, to: string): string[] {
  const n = Math.max(1, lines.length - 1);
  return lines.map((line, i) => fgHex(lerpHex(from, to, i / n)) + line + RESET);
}

export function padCenter(s: string, width: number): string {
  const len = visibleWidth(s);
  if (len >= width) return s;
  const left = Math.floor((width - len) / 2);
  return ' '.repeat(left) + s;
}
