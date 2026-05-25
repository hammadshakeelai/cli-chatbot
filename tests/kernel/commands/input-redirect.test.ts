import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { catCommand as cat } from '@/kernel/commands/cat';
import { headCommand as head } from '@/kernel/commands/head';
import { wcCommand as wc } from '@/kernel/commands/wc';
function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(cat);
  registry.register(head);
  registry.register(wc);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('input redirects', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/hello.txt', 'Hello world\nLine two\nLine three\n', '/');
    vfs.write('/home/data.txt', 'foo\nbar\nbaz\n', '/');
    vfs.write('/home/empty.txt', '', '/');
    vfs.write('/home/binary.dat', '\x00\x01\x02\xff\xfe', '/');
  });

  it('cat reads from stdin redirect', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat < /home/hello.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('Hello world');
    expect(result.output).toContain('Line two');
  });

  it('head reads piped input from cat with redirect', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat < /home/hello.txt | head -n2', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('Hello world');
    expect(result.output).toContain('Line two');
    expect(result.output).not.toContain('Line three');
  });

  it('wc reads from stdin redirect', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('wc -l < /home/hello.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toMatch(/3/);
  });

  it('cat on empty file via redirect yields nothing', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat < /home/empty.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });

  it('piped input with redirect from file to wc', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat < /home/data.txt | wc -l', kernel, '/', new AbortController().signal);
    expect(result.output).toMatch(/3/);
  });

  it('binary file content via input redirect', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat < /home/binary.dat', kernel, '/', new AbortController().signal);
    expect(result.output.length).toBeGreaterThan(0);
  });
});
