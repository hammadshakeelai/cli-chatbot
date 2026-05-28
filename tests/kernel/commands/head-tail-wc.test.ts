import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { headCommand } from '@/kernel/commands/head';
import { tailCommand } from '@/kernel/commands/tail';
import { wcCommand } from '@/kernel/commands/wc';
import { catCommand } from '@/kernel/commands/cat';
import { echoCommand } from '@/kernel/commands/echo';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(headCommand);
  registry.register(tailCommand);
  registry.register(wcCommand);
  registry.register(catCommand);
  registry.register(echoCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('head command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/data.txt', 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\n', '/');
  });

  it('prints first 10 lines by default', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('head /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('a');
    expect(result.output).toContain('j');
    expect(result.output).not.toContain('k');
  });

  it('reads custom -n flag', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('head -n2 /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('a');
    expect(result.output).not.toContain('c');
  });

  it('errors on missing file', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('head /home/nope.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No such file');
  });
});

describe('tail command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    // 12 lines (a-l) — split yields 13 elements with trailing empty
    vfs.write('/home/data.txt', 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\n', '/');
  });

  it('prints last 10 lines by default (skipping a-b)', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('tail /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('c');
    expect(result.output).toContain('l');
    expect(result.output).not.toContain('a');
    expect(result.output).not.toContain('b');
  });

  it('prints custom -n2 lines', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('tail -n2 /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('l');
  });

  it('errors on missing file', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('tail /home/nope.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No such file');
  });
});

describe('wc command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/data.txt', 'hello world\nfoo bar baz\nend\n', '/');
  });

  it('counts lines, words, chars', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('wc /home/data.txt', kernel, '/', new AbortController().signal);
    const parts = result.output.trim().split(/\s+/);
    expect(parts[0]).toBe('3');  // lines
    expect(parts[1]).toBe('6');  // words
  });

  it('reads from stdin via pipe', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('echo hello world | wc', kernel, '/', new AbortController().signal);
    const parts = result.output.trim().split(/\s+/);
    expect(parts[0]).toBe('1');  // lines
    expect(parts[1]).toBe('2');  // words
  });

  it('errors on missing file', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('wc /home/nope.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No such file');
  });
});
