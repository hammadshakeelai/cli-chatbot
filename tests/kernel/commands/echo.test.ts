import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { echoCommand } from '@/kernel/commands/echo';
import { buildContext } from '@/kernel/pipeline';

describe('echo', () => {
  const registry = new CommandRegistry();

  it('prints arguments', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'echo', args: ['hello', 'world'] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of echoCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toBe('hello world\n');
  });

  it('prints empty line with no args', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = buildContext(
      { command: 'echo', args: [] }, { commands: [], op: ';' },
      '/', env, vfs, new AbortController().signal, registry, undefined,
      (c: string) => chunks.push(c),
    );
    for await (const chunk of echoCommand.run(ctx)) chunks.push(chunk);
    expect(chunks.join('')).toBe('\n');
  });
});
