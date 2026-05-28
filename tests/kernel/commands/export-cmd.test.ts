import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { exportCommand } from '@/kernel/commands/export-cmd';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(exportCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('export command', () => {
  it('exports txt format', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('export txt', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('Terminal');
    expect(result.output).toContain('End');
  });

  it('exports md format', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('export md', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('# Terminal');
  });

  it('exports default txt', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('export', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('Terminal');
  });
});
