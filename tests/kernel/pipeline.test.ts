import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { echoCommand } from '@/kernel/commands/echo';
import { pwdCommand } from '@/kernel/commands/pwd';
import { catCommand } from '@/kernel/commands/cat';

describe('executeLine', () => {
  const registry = new CommandRegistry();
  registry.register(echoCommand);
  registry.register(pwdCommand);
  registry.register(catCommand);

  it('executes a simple command', async () => {
    const vfs = new VFS();
    const env = new Env();
    const result = await executeLine('echo hello', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toContain('hello');
  });

  it('reports unknown command', async () => {
    const vfs = new VFS();
    const env = new Env();
    const result = await executeLine('nonexistent', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toContain('command not found');
  });

  it('handles empty input', async () => {
    const vfs = new VFS();
    const env = new Env();
    const result = await executeLine('', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });

  it('executes pipeline with &&', async () => {
    const vfs = new VFS();
    const env = new Env();
    const result = await executeLine('echo hello && echo world', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toContain('hello');
    expect(result.output).toContain('world');
  });
});
