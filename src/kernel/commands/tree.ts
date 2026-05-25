import type { Command, CommandContext, OutputChunk, VFSNode } from '../types';

export const treeCommand: Command = {
  name: 'tree',
  help: 'Display directory tree. Usage: tree [path]',
  usage: 'tree [path]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const target = ctx.args[0] || '.';
    const resolved = ctx.vfs.resolve(target, ctx.cwd);
    const node = ctx.vfs.stat(resolved, '/');
    if (!node || node.type !== 'dir') {
      yield `tree: ${target}: No such directory\n`;
      return;
    }

    let result = `${resolved}\n`;
    if (node.children) {
      const entries = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      for (let i = 0; i < entries.length; i++) {
        const [name, child] = entries[i]!;
        const isLast = i === entries.length - 1;
        result += (isLast ? '└── ' : '├── ') + name + '\n';
        if (child.type === 'dir' && child.children) {
          result += renderSubtree(child, isLast ? '    ' : '│   ');
        }
      }
    }

    yield result;
  },
};

function renderSubtree(node: VFSNode, prefix: string): string {
  let result = '';
  if (!node.children) return result;

  const entries = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 0; i < entries.length; i++) {
    const [name, child] = entries[i]!;
    const isLast = i === entries.length - 1;
    result += prefix + (isLast ? '└── ' : '├── ') + name + '\n';
    if (child.type === 'dir' && child.children) {
      result += renderSubtree(child, prefix + (isLast ? '    ' : '│   '));
    }
  }
  return result;
}
