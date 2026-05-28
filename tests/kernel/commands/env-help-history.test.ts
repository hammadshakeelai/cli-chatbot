import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { envCommand } from '@/kernel/commands/env';
import { helpCommand, setHelpRegistry } from '@/kernel/commands/help';
import { manCommand } from '@/kernel/commands/man';
import { historyCommand, setHistorySource } from '@/kernel/commands/history';

function makeKernel(vfs: VFS, history: string[] = []) {
  const registry = new CommandRegistry();
  registry.register(envCommand);
  registry.register(helpCommand);
  registry.register(manCommand);
  registry.register(historyCommand);
  setHelpRegistry(registry);
  setHistorySource(history);
  return { vfs, env: new Env(), registry, history };
}

describe('env command', () => {
  it('lists environment variables', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('env', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('=');
  });
});

describe('help command', () => {
  it('lists available commands', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('help', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('help');
    expect(result.output).toContain('env');
  });
});

describe('man command', () => {
  it('shows usage for a command', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('man env', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('env');
  });

  it('errors on unknown command', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('man nonexistent', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No help');
  });
});

describe('history command', () => {
  it('lists command history', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs, ['ls', 'cd /home', 'echo hi']);
    const result = await executeLine('history', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('ls');
    expect(result.output).toContain('echo hi');
  });

  it('shows No history message when empty', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs, []);
    const result = await executeLine('history', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('No history');
  });
});
