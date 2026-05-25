import type { VFSNode } from './types';

export class VFS {
  private root: VFSNode;
  private homePath = '/home/user';

  constructor() {
    this.root = this.createSeed();
  }

  private createSeed(): VFSNode {
    const now = Date.now();
    return {
      type: 'dir',
      name: '',
      mode: 0o755,
      mtime: now,
      children: new Map([
        ['home', {
          type: 'dir', name: 'home', mode: 0o755, mtime: now,
          children: new Map([
            ['user', {
              type: 'dir', name: 'user', mode: 0o755, mtime: now,
              children: new Map([
                ['welcome.txt', {
                  type: 'file', name: 'welcome.txt', mode: 0o644, mtime: now,
                  content: 'Welcome to Mirage — a terminal that isn\'t there.\nType help to see available commands.\n',
                }],
                ['Documents', {
                  type: 'dir', name: 'Documents', mode: 0o755, mtime: now,
                  children: new Map([
                    ['asciiart', {
                      type: 'dir', name: 'asciiart', mode: 0o755, mtime: now,
                      children: new Map(),
                    }],
                  ]),
                }],
              ]),
            }],
          ]),
        }],
        ['bin', {
          type: 'dir', name: 'bin', mode: 0o755, mtime: now,
          children: new Map(),
        }],
        ['etc', {
          type: 'dir', name: 'etc', mode: 0o755, mtime: now,
          children: new Map(),
        }],
        ['tmp', {
          type: 'dir', name: 'tmp', mode: 0o777, mtime: now,
          children: new Map(),
        }],
        ['var', {
          type: 'dir', name: 'var', mode: 0o755, mtime: now,
          children: new Map([
            ['lib', {
              type: 'dir', name: 'lib', mode: 0o755, mtime: now,
              children: new Map([
                ['mirage', {
                  type: 'dir', name: 'mirage', mode: 0o755, mtime: now,
                  children: new Map(),
                }],
              ]),
            }],
          ]),
        }],
      ]),
    };
  }

  resolve(path: string, cwd: string): string {
    if (!path || path === '~') return this.homePath;
    if (path.startsWith('~/') || path === '~') return this.homePath + path.slice(1);
    if (path.startsWith('/')) return this.normalize(path);
    return this.normalize(cwd + '/' + path);
  }

  private normalize(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const result: string[] = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') { result.pop(); continue; }
      result.push(p);
    }
    return '/' + result.join('/');
  }

  private getNode(absPath: string): VFSNode | undefined {
    if (absPath === '/') return this.root;
    const parts = absPath.split('/').filter(Boolean);
    let current = this.root;
    for (const part of parts) {
      if (!current.children) return undefined;
      const child = current.children.get(part);
      if (!child) return undefined;
      current = child;
    }
    return current;
  }

  private getParent(absPath: string): { parent: VFSNode; name: string } | undefined {
    if (absPath === '/') return undefined;
    const parentPath = this.normalize(absPath + '/..');
    const name = absPath.split('/').filter(Boolean).pop();
    if (!name) return undefined;
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'dir') return undefined;
    return { parent, name };
  }

  read(absPath: string, cwd: string): string | undefined {
    const resolved = this.resolve(absPath, cwd);
    const node = this.getNode(resolved);
    if (!node || node.type !== 'file') return undefined;
    return node.content;
  }

  write(absPath: string, content: string, cwd: string): boolean {
    const resolved = this.resolve(absPath, cwd);
    const parent = this.getParent(resolved);
    if (!parent) return false;
    const existing = parent.parent.children?.get(parent.name);
    if (existing && existing.type !== 'file') return false;
    parent.parent.children?.set(parent.name, {
      type: 'file',
      name: parent.name,
      content,
      mode: 0o644,
      mtime: Date.now(),
    });
    return true;
  }

  mkdir(absPath: string, cwd: string, opts?: { parents?: boolean }): boolean {
    const resolved = this.resolve(absPath, cwd);
    if (opts?.parents) {
      const parts = resolved.split('/').filter(Boolean);
      let current = '/';
      for (const part of parts) {
        current += '/' + part;
        const node = this.getNode(current);
        if (!node) {
          const parent = this.getParent(current);
          if (!parent) return false;
          parent.parent.children?.set(part, {
            type: 'dir',
            name: part,
            mode: 0o755,
            mtime: Date.now(),
            children: new Map(),
          });
        }
      }
      return true;
    }
    if (this.getNode(resolved)) return false;
    const parent = this.getParent(resolved);
    if (!parent) return false;
    const existed = parent.parent.children?.has(parent.name);
    if (existed) return false;
    parent.parent.children?.set(parent.name, {
      type: 'dir',
      name: parent.name,
      mode: 0o755,
      mtime: Date.now(),
      children: new Map(),
    });
    return true;
  }

  list(absPath: string, cwd: string): VFSNode[] | undefined {
    const resolved = this.resolve(absPath, cwd);
    const node = this.getNode(resolved);
    if (!node || node.type !== 'dir') return undefined;
    return Array.from(node.children?.values() ?? []);
  }

  exists(absPath: string, cwd: string): boolean {
    const resolved = this.resolve(absPath, cwd);
    return this.getNode(resolved) !== undefined;
  }

  stat(absPath: string, cwd: string): VFSNode | undefined {
    const resolved = this.resolve(absPath, cwd);
    return this.getNode(resolved);
  }

  unlink(absPath: string, cwd: string, opts?: { recursive?: boolean }): boolean {
    const resolved = this.resolve(absPath, cwd);
    const node = this.getNode(resolved);
    if (!node) return false;
    if (node.type === 'dir' && node.children && node.children.size > 0 && !opts?.recursive) return false;
    const parent = this.getParent(resolved);
    if (!parent) return false;
    return parent.parent.children?.delete(parent.name) ?? false;
  }

  move(srcPath: string, destPath: string, cwd: string): boolean {
    const srcResolved = this.resolve(srcPath, cwd);
    const node = this.getNode(srcResolved);
    if (!node) return false;
    const srcParent = this.getParent(srcResolved);
    if (!srcParent) return false;
    const destResolved = this.resolve(destPath, cwd);
    const destParent = this.getParent(destResolved);
    if (!destParent) return false;
    srcParent.parent.children?.delete(srcParent.name);
    destParent.parent.children?.set(destParent.name, { ...node, name: destParent.name, mtime: Date.now() });
    return true;
  }

  copy(srcPath: string, destPath: string, cwd: string): boolean {
    const srcResolved = this.resolve(srcPath, cwd);
    const node = this.getNode(srcResolved);
    if (!node) return false;
    const destResolved = this.resolve(destPath, cwd);
    const destParent = this.getParent(destResolved);
    if (!destParent) return false;
    destParent.parent.children?.set(destParent.name, this.cloneNode({ ...node, name: destParent.name, mtime: Date.now() }));
    return true;
  }

  private cloneNode(node: VFSNode): VFSNode {
    return {
      ...node,
      children: node.children ? new Map(node.children) : undefined,
    };
  }

  toJSON(): VFSNode {
    return this.root;
  }

  fromJSON(data: VFSNode): void {
    this.root = data;
  }

  get home(): string {
    return this.homePath;
  }
}
