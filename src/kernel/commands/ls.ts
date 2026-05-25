import type { Command, CommandContext, OutputChunk } from '../types';

export const lsCommand: Command = {
  name: 'ls',
  help: 'List directory contents. Usage: ls [-la] [path]',
  usage: 'ls [-la] [path...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const showAll = ctx.flags['l'] || ctx.flags['a'] || ctx.flags['la'] || ctx.flags['al'];
    const targets = ctx.args.length > 0 ? ctx.args : ['.'];
    for (const target of targets) {
      const nodes = ctx.vfs.list(target, ctx.cwd);
      if (!nodes) {
        yield `ls: cannot access '${target}': No such file or directory\n`;
        continue;
      }
      if (showAll) {
        let total = 0;
        const lines: string[] = [];
        for (const node of nodes) {
          const perms = node.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = node.content?.length ?? 0;
          total += size;
          const date = new Date(node.mtime).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          lines.push(`${perms} 1 user user ${String(size).padStart(5)} ${date} ${node.name}`);
        }
        yield `total ${total}\n`;
        yield lines.join('\n') + '\n';
      } else {
        yield nodes.map((n) => n.name).join('  ') + '\n';
      }
    }
  },
};
