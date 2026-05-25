import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { catCommand } from '@/kernel/commands/cat';
import { buildContext } from '@/kernel/pipeline';

describe('cat', () => {
  const registry = new CommandRegistry();

  it('prints file contents', async () => {
    const vfs = new VFS();
    vfs.write('/home/user/test.txt', 'hello world', '/');
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'cat', args: ['/home/user/test.txt'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of catCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('hello world');
  });

  it('shows error for missing file', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'cat', args: ['/nonexistent'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of catCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('No such file');
  });
});
