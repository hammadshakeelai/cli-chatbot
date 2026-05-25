import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { echoCommand } from '@/kernel/commands/echo';
import { pwdCommand } from '@/kernel/commands/pwd';

describe('executeLine', () => {
  it('executes a simple command', async () => {
    const vfs = new VFS();
    const env = new Env();
    const registry = new CommandRegistry();
    registry.register(echoCommand);
    const result = await executeLine('echo hello', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toContain('hello');
  });

  it('reports unknown command', async () => {
    const vfs = new VFS();
    const env = new Env();
    const registry = new CommandRegistry();
    const result = await executeLine('nonexistent', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toContain('command not found');
  });

  it('handles empty input', async () => {
    const vfs = new VFS();
    const env = new Env();
    const registry = new CommandRegistry();
    const result = await executeLine('', { vfs, env, registry, history: [] }, '/', new AbortController().signal);
    expect(result.output).toBe('');
  });

  it('handles interrupt signal', async () => {
    const vfs = new VFS();
    const env = new Env();
    const registry = new CommandRegistry();
    registry.register(pwdCommand);
    const controller = new AbortController();
    controller.abort();
    const result = await executeLine('pwd', { vfs, env, registry, history: [] }, '/', controller.signal);
    // Should not throw, output should still work since pwd is sync
    expect(result.output).toBeDefined();
  });
});
