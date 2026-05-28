import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { grepCommand } from '@/kernel/commands/grep';
import { catCommand } from '@/kernel/commands/cat';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(grepCommand);
  registry.register(catCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('grep command', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/data.txt', 'hello world\nfoo bar\nhello again\nbaz\n', '/');
  });

  it('finds matching lines', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('grep hello /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('hello world');
    expect(result.output).toContain('hello again');
    expect(result.output).not.toContain('foo bar');
  });

  it('returns empty for no matches', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('grep nonexistent /home/data.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });

  it('errors on missing file', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('grep hello /home/nope.txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No such file');
  });

  it('reads from stdin via pipe', async () => {
    vfs.write('/home/names.txt', 'alice\nbob\ncharlie\n', '/');
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat /home/names.txt | grep bob', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('bob');
    expect(result.output).not.toContain('alice');
  });

  it('errors without pattern', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('grep', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('missing pattern');
  });
});
