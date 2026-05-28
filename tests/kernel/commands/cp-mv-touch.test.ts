import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { cpCommand } from '@/kernel/commands/cp';
import { mvCommand } from '@/kernel/commands/mv';
import { touchCommand } from '@/kernel/commands/touch';
import { lsCommand } from '@/kernel/commands/ls';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(cpCommand);
  registry.register(mvCommand);
  registry.register(touchCommand);
  registry.register(lsCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('cp command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/src.txt', 'content', '/');
  });

  it('copies a file', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('cp /home/src.txt /home/dst.txt', kernel, '/', new AbortController().signal);
    expect(vfs.read('/home/dst.txt', '/')).toBe('content');
  });

  it('errors on missing source', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cp /home/nope.txt /home/dst.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('cannot copy');
  });

  it('errors without arguments', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cp', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('missing operand');
  });
});

describe('mv command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/src.txt', 'content', '/');
  });

  it('moves a file', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('mv /home/src.txt /home/dst.txt', kernel, '/', new AbortController().signal);
    expect(vfs.read('/home/dst.txt', '/')).toBe('content');
    expect(vfs.read('/home/src.txt', '/')).toBeUndefined();
  });

  it('errors on missing source', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('mv /home/nope.txt /home/dst.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('cannot move');
  });
});

describe('touch command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
  });

  it('creates empty file', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('touch /home/new.txt', kernel, '/', new AbortController().signal);
    expect(vfs.read('/home/new.txt', '/')).toBe('');
  });

  it('creates file in current directory', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('touch newfile.txt', kernel, '/home', new AbortController().signal);
    expect(vfs.read('/home/newfile.txt', '/')).toBe('');
  });

  it('creates file even in nonexistent path (no error)', async () => {
    // touch typically creates empty parent, so no error expected
    const kernel = makeKernel(vfs);
    const result = await executeLine('touch /nonexistent/file.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });
});
