import type { Command, CommandContext, OutputChunk } from '../types';

const RAINBOW_COLORS = [
  '\x1b[31m', // red
  '\x1b[33m', // yellow
  '\x1b[32m', // green
  '\x1b[36m', // cyan
  '\x1b[34m', // blue
  '\x1b[35m', // magenta
];
const RESET = '\x1b[0m';

function rainbow(text: string, offset = 0): string {
  let result = '';
  let colorIdx = offset;

  for (const ch of text) {
    if (ch === ' ') {
      result += ' ';
      continue;
    }
    if (ch === '\n') {
      result += '\n';
      continue;
    }
    result += RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length]! + ch;
    colorIdx++;
  }

  return result + RESET;
}

export const lolcatCommand: Command = {
  name: 'lolcat',
  help: 'Display text in rainbow colors. Usage: lolcat [file] or pipe input',
  usage: 'lolcat [file]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('lolcat', ctx.vfs)) {
      yield "command not found: try apt install lolcat\n";
      return;
    }

    if (ctx.stdin) {
      for await (const chunk of ctx.stdin) {
        yield rainbow(chunk, 0);
      }
      return;
    }

    const file = ctx.args[0];
    if (file) {
      const resolved = ctx.vfs.resolve(file, ctx.cwd);
      const content = ctx.vfs.read(resolved, '/');
      if (content === undefined) {
        yield `cat: ${file}: No such file or directory\n`;
        return;
      }
      yield rainbow(content, 0);
      return;
    }

    // If no stdin and no file, print usage
    yield 'Usage: lolcat [file]\n  or: command | lolcat\n';
  },
};
