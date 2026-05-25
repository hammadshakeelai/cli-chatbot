import type { VFS } from './vfs';
import type { CommandRegistry } from './registry';

export interface CompletionResult {
  matches: string[];
  partial: string;
}

export function complete(
  partial: string,
  isCommand: boolean,
  registry: CommandRegistry,
  vfs: VFS,
  cwd: string,
): CompletionResult {
  if (isCommand) {
    const cmds = registry.list().map((c) => c.name);
    const matches = cmds.filter((c) => c.startsWith(partial)).sort();
    return { matches, partial };
  }

  const lastSlash = partial.lastIndexOf('/');
  const dir = lastSlash >= 0 ? partial.slice(0, lastSlash) || '/' : '.';
  const base = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial;
  const resolvedDir = vfs.resolve(dir, cwd);

  const nodes = vfs.list(resolvedDir, '/');
  if (!nodes) return { matches: [], partial };

  const matches = nodes
    .filter((n) => n.name.startsWith(base))
    .map((n) => {
      const prefix = lastSlash >= 0 ? dir + '/' : '';
      return prefix + n.name + (n.type === 'dir' ? '/' : '');
    })
    .sort();

  return { matches, partial };
}
