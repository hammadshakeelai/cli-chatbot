import type { Command, CommandContext, OutputChunk } from '../types';

export const touchCommand: Command = {
  name: 'touch',
  help: 'Create empty files. Usage: touch <file> [file...]',
  usage: 'touch <file> [file...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length === 0) {
      yield 'touch: missing operand\n';
      return;
    }
    for (const arg of ctx.args) {
      ctx.vfs.write(arg, '', ctx.cwd);
    }
  },
};
