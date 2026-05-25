import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { Env } from '@/kernel/env';
import { echoCommand } from '@/kernel/commands/echo';
import { createContext } from '@/kernel/pipeline';

describe('echo', () => {
  it('prints arguments', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext(['hello', 'world'], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of echoCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe('hello world\n');
  });

  it('prints empty line with no args', async () => {
    const vfs = new VFS();
    const env = new Env();
    const chunks: string[] = [];
    const ctx = createContext([], '/', env, vfs, new AbortController().signal, (c) => chunks.push(c));
    for await (const chunk of echoCommand.run(ctx)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe('\n');
  });
});
