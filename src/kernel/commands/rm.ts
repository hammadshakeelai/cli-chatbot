import type { Command, CommandContext, OutputChunk } from '../types';

export const rmCommand: Command = {
  name: 'rm',
  help: 'Remove files or directories. Usage: rm [-r] <path> [path...]',
  usage: 'rm [-rf] <path> [path...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const recursive = ctx.flags['r'] === true || ctx.flags['rf'] === true || ctx.flags['fr'] === true;
    const targets = ctx.args.filter((a) => !a.startsWith('-'));
    if (targets.length === 0) {
      yield 'rm: missing operand\n';
      return;
    }
    for (const target of targets) {
      const node = ctx.vfs.stat(target, ctx.cwd);
      if (!node) {
        yield `rm: cannot remove '${target}': No such file or directory\n`;
        continue;
      }
      if (node.type === 'dir' && !recursive) {
        yield `rm: cannot remove '${target}': Is a directory\n`;
        continue;
      }
      ctx.vfs.unlink(target, ctx.cwd, { recursive });
    }
  },
};
