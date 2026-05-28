import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { CommandRegistry } from '@/kernel/registry';
import { executeLine } from '@/kernel/pipeline';
import { dateCommand } from '@/kernel/commands/date';
import { calCommand } from '@/kernel/commands/cal';
import { whichCommand } from '@/kernel/commands/which';
import { whoamiCommand } from '@/kernel/commands/whoami';
import { clearCommand } from '@/kernel/commands/clear';
import { unameCommand } from '@/kernel/commands/uname';
import { dfCommand } from '@/kernel/commands/df';
import { uptimeCommand } from '@/kernel/commands/uptime';
import { psCommand } from '@/kernel/commands/ps';

function makeKernel(vfs: VFS) {
  const registry = new CommandRegistry();
  registry.register(dateCommand);
  registry.register(calCommand);
  registry.register(whichCommand);
  registry.register(whoamiCommand);
  registry.register(clearCommand);
  registry.register(unameCommand);
  registry.register(dfCommand);
  registry.register(uptimeCommand);
  registry.register(psCommand);
  return { vfs, env: new Env(), registry, history: [] as string[] };
}

describe('date command', () => {
  it('outputs a date string', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('date', kernel, '/', new AbortController().signal);
    expect(result.output.trim()).toBeTruthy();
  });
});

describe('cal command', () => {
  it('outputs a calendar', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('cal', kernel, '/', new AbortController().signal);
    expect(result.output.length).toBeGreaterThan(20);
  });
});

describe('which command', () => {
  it('finds a registered command', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('which date', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('date');
  });

  it('reports command not found', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('which nonexistent', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('not found');
  });
});

describe('whoami command', () => {
  it('outputs user name (default: user)', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('whoami', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('user');
  });
});

describe('clear command', () => {
  it('emits ANSI escape codes', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('clear', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('\x1b[');
  });
});

describe('uname command', () => {
  it('outputs system name', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('uname', kernel, '/', new AbortController().signal);
    expect(result.output.trim()).toBeTruthy();
  });
});

describe('df command', () => {
  it('outputs disk usage', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('df', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('/');
  });
});

describe('uptime command', () => {
  it('outputs uptime string', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('uptime', kernel, '/', new AbortController().signal);
    expect(result.output.length).toBeGreaterThan(5);
  });
});

describe('ps command', () => {
  it('outputs process list header', async () => {
    const vfs = new VFS();
    const kernel = makeKernel(vfs);
    const result = await executeLine('ps', kernel, '/', new AbortController().signal);
    expect(result.output).toContain('PID');
  });
});
