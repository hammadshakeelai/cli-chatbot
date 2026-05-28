import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { cdCommand } from '@/kernel/commands/cd';
import { pwdCommand } from '@/kernel/commands/pwd';
import { lsCommand } from '@/kernel/commands/ls';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(cdCommand);
  registry.register(pwdCommand);
  registry.register(lsCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('cd command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/home/sub', '/');
    vfs.mkdir('/home/sub/deep', '/');
  });

  it('changes to a valid directory', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd /home', kernel, '/', new AbortController().signal);
    expect(result.newCwd).toBe('/home');
  });

  it('changes to subdirectory', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd sub', kernel, '/home', new AbortController().signal);
    expect(result.newCwd).toBe('/home/sub');
  });

  it('changes to parent with ..', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd ..', kernel, '/home/sub', new AbortController().signal);
    expect(result.newCwd).toBe('/home');
  });

  it('changes to root', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd /', kernel, '/home/sub', new AbortController().signal);
    expect(result.newCwd).toBe('/');
  });

  it('errors on nonexistent directory', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd /nonexistent', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('cd');
    expect(result.output).toContain('nonexistent');
    expect(result.newCwd).toBe('/');
  });

  it('errors when path is a file', async () => {
    vfs.write('/home/file.txt', 'a', '/');
    const kernel = makeKernel(vfs);
    const result = await executeLine('cd /home/file.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('not a directory');
  });
});

describe('pwd command', () => {
  it('prints current working directory', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('pwd', kernel, '/home', new AbortController().signal);
    expect(result.output).toContain('/home');
  });

  it('prints root', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('pwd', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('/');
  });
});
