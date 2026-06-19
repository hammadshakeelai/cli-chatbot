import { sgr, RESET, fgHex, visibleWidth, gradientLines } from '@/term/ansi';

/** Rounded box around content lines; border colored, content as-is. */
export function box(lines: string[], color: string, minWidth = 0): string[] {
  const width = Math.max(minWidth, ...lines.map((l) => visibleWidth(l))) + 2;
  const top = color + '╭' + '─'.repeat(width) + '╮' + RESET;
  const bottom = color + '╰' + '─'.repeat(width) + '╯' + RESET;
  const body = lines.map((l) => {
    const pad = width - visibleWidth(l) - 1;
    return color + '│' + RESET + ' ' + l + ' '.repeat(Math.max(0, pad)) + color + '│' + RESET;
  });
  return [top, ...body, bottom];
}

/** Compact fallback for narrow terminals. */
export function compactBanner(title: string, accent: string, lines: string[]): string[] {
  return [
    fgHex(accent) + sgr.bold + title + RESET,
    ...lines.map((l) => sgr.dim + l + RESET),
  ];
}

export function gradientArt(art: string[], from: string, to: string): string[] {
  return gradientLines(art, from, to);
}
