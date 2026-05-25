import type { Command, CommandContext, OutputChunk } from '../types';

export const cdCommand: Command = {
  name: 'cd',
  help: 'Change directory. Usage: cd [path]',
  usage: 'cd [path]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const target = ctx.args[0] || '~';
    const resolved = ctx.vfs.resolve(target, ctx.cwd);
    const node = ctx.vfs.stat(resolved, '/');
    if (!node) {
      yield `cd: no such file or directory: ${target}\n`;
      return;
    }
    if (node.type !== 'dir') {
      yield `cd: not a directory: ${target}\n`;
      return;
    }
    ctx.env.set('PWD', resolved);
    ctx.emit('__cd__' + resolved);
  },
};
