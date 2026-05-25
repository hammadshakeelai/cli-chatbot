import type { Command, CommandContext, OutputChunk } from '../types';

export const wcCommand: Command = {
  name: 'wc',
  help: 'Count lines, words, characters. Usage: wc [file]',
  usage: 'wc [file]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    let text: string;
    if (ctx.args.length >= 1) {
      const content = ctx.vfs.read(ctx.args[0]!, ctx.cwd);
      if (content === undefined) {
        yield `wc: ${ctx.args[0]}: No such file or directory\n`;
        return;
      }
      text = content;
    } else if (ctx.stdin) {
      const chunks: string[] = [];
      for await (const chunk of ctx.stdin) chunks.push(chunk);
      text = chunks.join('');
    } else {
      return;
    }

    const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;

    const label = ctx.args[0] ?? '';
    yield `${String(lines).padStart(4)} ${String(words).padStart(4)} ${String(chars).padStart(4)} ${label}\n`;
  },
};
