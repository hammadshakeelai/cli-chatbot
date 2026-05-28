import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { settingsCommand, shareThemeCommand } from '@/kernel/commands/settings-cmd';
import { soundCommand } from '@/kernel/commands/sound-cmd';
import { fxCommand } from '@/kernel/commands/fx-cmd';
import { uiCommand } from '@/kernel/commands/ui-cmd';
import { dayCommand, nightCommand } from '@/kernel/commands/day-cmd';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(settingsCommand);
  registry.register(shareThemeCommand);
  registry.register(soundCommand);
  registry.register(fxCommand);
  registry.register(uiCommand);
  registry.register(dayCommand);
  registry.register(nightCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('settings command', () => {
  it('exports settings as JSON', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('settings export', kernel, '/', new AbortController().signal);
    expect(() => JSON.parse(result.output)).not.toThrow();
  });
});

describe('sound command', () => {
  it('reports current state', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('sound', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('on');
  });

  it('toggles off', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('sound off', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('disabled');
  });
});

describe('fx command', () => {
  it('lists fx status', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('fx', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('on');
  });

  it('toggles off', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('fx off', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('off');
  });
});

describe('day/night commands', () => {
  it('day command outputs mode switch', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('day', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('light');
  });

  it('night command outputs mode switch', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('night', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('dark');
  });
});
