import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { echoCommand } from '@/kernel/commands/echo';
import { catCommand } from '@/kernel/commands/cat';
import { lsCommand } from '@/kernel/commands/ls';
import { grepCommand } from '@/kernel/commands/grep';
import { wcCommand } from '@/kernel/commands/wc';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(echoCommand);
  registry.register(catCommand);
  registry.register(lsCommand);
  registry.register(grepCommand);
  registry.register(wcCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('pipeline edge cases', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'home');
    vfs.write('/home/data.txt', 'hello world\nfoo bar\n', '/');
  });

  it('executes empty line safely', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('', kernel, '/', new AbortController().signal);
    expect(result.output).toBe('');
    expect(result.newCwd).toBe('/');
  });

  it('executes whitespace-only line safely', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('   ', kernel, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });

  it('executes && chain in order', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('echo first && echo second', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('first');
    expect(result.output).toContain('second');
  });

  it('handles ; separator', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('echo a ; echo b', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('a');
    expect(result.output).toContain('b');
  });

  it('handles pipe with redirect', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('cat /home/data.txt | wc -l', kernel, '/', new AbortController().signal);
    expect(result.output).toMatch(/\d/);
  });

  it('reports unknown command', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('nonexistent', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('command not found');
  });

  it('handles fallthrough callback', async () => {
    const kernel = makeKernel(vfs);
    const fallthrough = async (cmd: string) => `fallthrough: ${cmd}\n`;
    const result = await executeLine('ask hello', kernel, '/', new AbortController().signal, undefined, fallthrough);
    expect(result.output).toContain('fallthrough');
  });

  it('handles output redirect', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('echo hello > /home/greeting.txt', kernel, '/', new AbortController().signal);
    expect(vfs.read('/home/greeting.txt', '/')).toContain('hello');
  });

  it('handles append redirect', async () => {
    const kernel = makeKernel(vfs);
    await executeLine('echo first >> /home/log.txt', kernel, '/', new AbortController().signal);
    await executeLine('echo second >> /home/log.txt', kernel, '/', new AbortController().signal);
    const content = vfs.read('/home/log.txt', '/');
    expect(content).toContain('first');
    expect(content).toContain('second');
  });

  it('executes commands after unknown command with ;', async () => {
    const kernel = makeKernel(vfs);
    const result = await executeLine('nonexistent ; echo after', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('command not found');
    expect(result.output).toContain('after');
  });
});
