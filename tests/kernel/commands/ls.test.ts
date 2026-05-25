import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { lsCommand } from '@/kernel/commands/ls';
import { createContext } from '@/kernel/pipeline';

describe('ls', () => {
  it('lists root directory', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext([], '/home/user', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of lsCommand.run(ctx)) {
      chunks.push(chunk);
    }
    const output = chunks.join('');
    expect(output).toContain('welcome.txt');
    expect(output).toContain('Documents');
  });

  it('shows error for nonexistent path', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/nonexistent'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of lsCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('No such file');
  });

  it('shows long format with -la', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['-la', '/home/user'], '/home/user', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of lsCommand.run(ctx)) {
      chunks.push(chunk);
    }
    const output = chunks.join('');
    expect(output).toContain('total');
    expect(output).toContain('drwxr-xr-x');
  });
});
