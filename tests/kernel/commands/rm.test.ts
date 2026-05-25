import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { rmCommand } from '@/kernel/commands/rm';
import { buildContext } from '@/kernel/pipeline';

describe('rm', () => {
  const registry = new CommandRegistry();

  it('removes a file', async () => {
    const vfs = new VFS();
    vfs.write('/home/user/delete.me', 'bye', '/');
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'rm', args: ['/home/user/delete.me'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of rmCommand.run(ctx)) chunks.push(chunk);
    expect(vfs.exists('/home/user/delete.me', '/')).toBe(false);
  });

  it('refuses to remove non-empty dir without -r', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'rm', args: ['/home/user'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of rmCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('Is a directory');
  });

  it('shows error for missing file', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'rm', args: ['/nonexistent'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of rmCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('No such file');
  });
});
