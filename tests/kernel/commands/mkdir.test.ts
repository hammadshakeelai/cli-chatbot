import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { mkdirCommand } from '@/kernel/commands/mkdir';
import { createContext } from '@/kernel/pipeline';

describe('mkdir', () => {
  it('creates a directory', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['testdir'], '/home/user', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of mkdirCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(vfs.exists('/home/user/testdir', '/')).toBe(true);
    expect(chunks.join('')).toBe('');
  });

  it('reports error for existing dir', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['/home/user'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of mkdirCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toContain('File exists');
  });
});
