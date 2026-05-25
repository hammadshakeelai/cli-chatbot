import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { catCommand } from '@/kernel/commands/cat';
import { createContext } from '@/kernel/pipeline';

describe('cat', () => {
  it('prints file contents', async () => {
    const vfs = new VFS();
    vfs.write('/home/user/test.txt', 'hello world', '/');
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/home/user/test.txt'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of catCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('hello world');
  });

  it('shows error for missing file', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/nonexistent'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of catCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('No such file');
  });
});
