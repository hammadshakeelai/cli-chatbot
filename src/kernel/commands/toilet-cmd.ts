import type { Command, CommandContext, OutputChunk } from '../types';
import figlet from 'figlet';

const BORDERS: Record<string, { top: string; bottom: string; left: string; right: string }> = {
  metal: { top: '▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄', bottom: '▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀', left: '█', right: '█' },
  double: { top: '╔══════════════════════════╗', bottom: '╚══════════════════════════╝', left: '║', right: '║' },
  rounded: { top: '╭──────────────────────────╮', bottom: '╰──────────────────────────╯', left: '│', right: '│' },
  star: { top: '✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶', bottom: '✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶✶', left: '✶', right: '✶' },
};

const COLORS = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m'];
const RESET = '\x1b[0m';

function applyBorder(text: string, borderStyle: keyof typeof BORDERS): string {
  const border = BORDERS[borderStyle];
  if (!border) return text;

  const lines = text.split('\n');
  const contentWidth = Math.max(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length));

  const top = border.top.padEnd(contentWidth + 4, border.top.slice(-1));
  const bottom = border.bottom.padEnd(contentWidth + 4, border.bottom.slice(-1));

  const bordered = lines.map((line) => {
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
    const padded = clean.padEnd(contentWidth);
    return `${border.left} ${padded} ${border.right}`;
  });

  return [top, ...bordered, bottom].join('\n');
}

function applyRainbow(text: string): string {
  let result = '';
  let ci = 0;
  for (const ch of text) {
    if (ch === '\n') { result += '\n'; continue; }
    result += COLORS[ci % COLORS.length]! + ch;
    ci++;
  }
  return result + RESET;
}

export const toiletCommand: Command = {
  name: 'toilet',
  help: 'Display large ASCII text with color and border flair. Usage: toilet [options] <text>',
  usage: 'toilet [-f font] [-b metal|double|rounded|star] <text>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('toilet', ctx.vfs)) {
      yield "command not found: try apt install toilet\n";
      return;
    }

    const args = [...ctx.args];
    let borderStyle: keyof typeof BORDERS | 'none' = 'none';
    let font: string | undefined;

    while (args.length > 0 && args[0]!.startsWith('-')) {
      const flag = args.shift()!;
      if (flag === '-b' || flag === '--border') {
        const style = args.shift()?.toLowerCase();
        if (style && style in BORDERS) borderStyle = style as keyof typeof BORDERS;
        else if (style === 'none') borderStyle = 'none';
        else { yield `Unknown border: ${style}\n`; return; }
      } else if (flag === '-f' || flag === '--font') {
        font = args.shift();
      } else {
        yield `Unknown option: ${flag}\n`;
        return;
      }
    }

    const text = args.join(' ');
    if (!text) {
      yield 'Usage: toilet [-f font] [-b metal|double|rounded|star] <text>\n';
      return;
    }

    try {
      let rendered: string;
      try {
        rendered = figlet.textSync(text, font ? { font: font as any } : undefined);
      } catch {
        // Fallback if font not found
        rendered = figlet.textSync(text);
      }

      // Apply options
      const colored = applyRainbow(rendered);
      const final = borderStyle !== 'none' ? applyBorder(colored, borderStyle) : colored;

      yield final + '\n';
    } catch {
      yield 'Error rendering text.\n';
    }
  },
};
