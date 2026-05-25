import type { Command, CommandContext, OutputChunk } from '../types';

export const mkdirCommand: Command = {
  name: 'mkdir',
  help: 'Create directories. Usage: mkdir [-p] <dir> [dir...]',
  usage: 'mkdir [-p] <dir> [dir...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const parents = ctx.flags['p'] === true;
    const targets = ctx.args.filter((a) => !a.startsWith('-'));
    if (targets.length === 0) {
      yield 'mkdir: missing operand\n';
      return;
    }
    for (const target of targets) {
      const resolved = ctx.vfs.resolve(target, ctx.cwd);
      if (ctx.vfs.exists(resolved, '/')) {
        if (!parents) yield `mkdir: cannot create directory '${target}': File exists\n`;
        continue;
      }
      const ok = ctx.vfs.mkdir(target, ctx.cwd, { parents });
      if (!ok) yield `mkdir: cannot create directory '${target}': Error\n`;
    }
  },
};
