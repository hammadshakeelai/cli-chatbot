import type { VFS } from './vfs';

export function expandGlob(pattern: string, vfs: VFS, cwd: string): string[] {
  if (!pattern.includes('*') && !pattern.includes('?')) {
    return [pattern];
  }

  // Find the base directory and the pattern part
  const lastSlash = pattern.lastIndexOf('/');
  const dir = lastSlash >= 0 ? pattern.slice(0, lastSlash) || '/' : '.';
  const filePat = lastSlash >= 0 ? pattern.slice(lastSlash + 1) : pattern;
  const resolvedDir = vfs.resolve(dir, cwd);

  const nodes = vfs.list(resolvedDir, '/');
  if (!nodes) return [pattern];

  const regex = new RegExp(
    '^' +
      filePat
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') +
      '$',
  );

  const matches = nodes
    .filter((n) => regex.test(n.name))
    .map((n) => {
      if (lastSlash >= 0) return dir + '/' + n.name;
      return n.name;
    });

  return matches.length > 0 ? matches : [pattern];
}
