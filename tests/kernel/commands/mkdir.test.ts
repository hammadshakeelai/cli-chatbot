import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { mkdirCommand } from '@/kernel/commands/mkdir';
import { buildContext } from '@/kernel/pipeline';

describe('mkdir', () => {
  const registry = new CommandRegistry();

  it('creates a directory', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'mkdir', args: ['testdir'] }, { commands: [], op: ';' },
      '/home/user', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of mkdirCommand.run(ctx)) chunks.push(chunk);
    expect(vfs.exists('/home/user/testdir', '/')).toBe(true);
  });

  it('reports error for existing dir', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'mkdir', args: ['/home/user'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of mkdirCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toContain('File exists');
  });
});
