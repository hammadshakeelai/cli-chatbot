import type { Command, CommandContext, OutputChunk } from '../types';

export const catCommand: Command = {
  name: 'cat',
  help: 'Concatenate and print files. Usage: cat <file> [file...]',
  usage: 'cat <file> [file...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length === 0) {
      if (ctx.stdin) {
        for await (const chunk of ctx.stdin) {
          yield chunk;
        }
        return;
      }
      yield 'cat: missing operand\n';
      return;
    }
    for (const arg of ctx.args) {
      const content = ctx.vfs.read(arg, ctx.cwd);
      if (content === undefined) {
        yield `cat: ${arg}: No such file or directory\n`;
        continue;
      }
      yield content + '\n';
    }
  },
};
