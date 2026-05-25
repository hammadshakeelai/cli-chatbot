import type { Command, CommandContext, OutputChunk } from '../types';

export const mvCommand: Command = {
  name: 'mv',
  help: 'Move or rename files. Usage: mv <src> <dest>',
  usage: 'mv <src> <dest>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length < 2) {
      yield 'mv: missing operand\n';
      return;
    }
    const src = ctx.args[0]!;
    const dest = ctx.args[1]!;
    const ok = ctx.vfs.move(src, dest, ctx.cwd);
    if (!ok) yield `mv: cannot move '${src}' to '${dest}': Error\n`;
  },
};
