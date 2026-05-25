import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { rmCommand } from '@/kernel/commands/rm';
import { createContext } from '@/kernel/pipeline';

describe('rm', () => {
  it('removes a file', async () => {
    const vfs = new VFS();
    vfs.write('/home/user/delete.me', 'bye', '/');
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/home/user/delete.me'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of rmCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(vfs.exists('/home/user/delete.me', '/')).toBe(false);
  });

  it('refuses to remove non-empty dir without -r', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/home/user'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of rmCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('Is a directory');
  });

  it('shows error for missing file', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/nonexistent'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of rmCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('No such file');
  });
});
