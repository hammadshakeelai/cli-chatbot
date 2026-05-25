import type { Command, CommandContext, OutputChunk } from '../types';

export const cpCommand: Command = {
  name: 'cp',
  help: 'Copy files. Usage: cp <src> <dest>',
  usage: 'cp <src> <dest>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length < 2) {
      yield 'cp: missing operand\n';
      return;
    }
    const src = ctx.args[0]!;
    const dest = ctx.args[1]!;
    const ok = ctx.vfs.copy(src, dest, ctx.cwd);
    if (!ok) yield `cp: cannot copy '${src}' to '${dest}': Error\n`;
  },
};
