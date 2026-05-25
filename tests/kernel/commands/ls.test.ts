import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { lsCommand } from '@/kernel/commands/ls';
import { buildContext } from '@/kernel/pipeline';

describe('ls', () => {
  const registry = new CommandRegistry();

  it('lists root directory', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'ls', args: [] }, { commands: [], op: ';' },
      '/home/user', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of lsCommand.run(ctx)) chunks.push(chunk);
    const output = chunks.join('');
    expect(output).toContain('welcome.txt');
    expect(output).toContain('Documents');
  });

  it('shows error for nonexistent path', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'ls', args: ['/nonexistent'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of lsCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('No such file');
  });

  it('shows long format with -la', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'ls', args: ['-la', '/home/user'] }, { commands: [], op: ';' },
      '/home/user', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of lsCommand.run(ctx)) chunks.push(chunk);
    const output = chunks.join('');
    expect(output).toContain('total');
    expect(output).toContain('drwxr-xr-x');
  });
});
