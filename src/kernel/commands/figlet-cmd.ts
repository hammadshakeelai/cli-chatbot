import type { Command, CommandContext, OutputChunk } from '../types';
import figlet from 'figlet';

export const figletCommand: Command = {
  name: 'figlet',
  help: 'Display large characters from ASCII text. Usage: figlet <text>',
  usage: 'figlet <text>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('figlet', ctx.vfs)) {
      yield "command not found: try apt install figlet\n";
      return;
    }

    const text = ctx.args.join(' ');
    if (!text) {
      yield 'Usage: figlet <text>\n';
      return;
    }

    try {
      const rendered = figlet.textSync(text);
      yield rendered + '\n';
    } catch {
      yield 'Error rendering text.\n';
    }
  },
};
