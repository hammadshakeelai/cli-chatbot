import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { neofetchCommand } from '@/kernel/commands/neofetch';
import { treeCommand } from '@/kernel/commands/tree';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(neofetchCommand);
  registry.register(treeCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('neofetch command', () => {
  it('outputs system info', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('neofetch', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('Mirage');
  });
});

describe('tree command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/home/work', '/');
    vfs.write('/home/foo.txt', 'a', '/');
    vfs.write('/home/work/bar.txt', 'b', '/');
  });

  it('shows directory tree with files', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('tree /home', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('home');
    expect(result.output).toContain('foo.txt');
    expect(result.output).toContain('work');
  });

  it('shows tree of current directory', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('tree', kernel, '/home', new AbortController().signal);
    expect(result.output).toContain('foo.txt');
  });
});
