import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { CommandRegistry } from '@/kernel/registry';
import { complete } from '@/kernel/completer';

describe('tab completion', () => {
  let vfs: VFS;
  let registry: CommandRegistry;

  beforeEach(() => {
    vfs = new VFS();
    registry = new CommandRegistry();
    registry.register({ name: 'cat', help: '', run: async function* () {} });
    registry.register({ name: 'cd', help: '', run: async function* () {} });
    registry.register({ name: 'clear', help: '', run: async function* () {} });
    registry.register({ name: 'cp', help: '', run: async function* () {} });
  });

  describe('command completion', () => {
    it('completes partial command', () => {
      const result = complete('c', true, registry, vfs, '/');
      expect(result.matches).toContain('cat');
      expect(result.matches).toContain('clear');
      expect(result.matches).not.toContain('ls');
    });

    it('returns empty on no match', () => {
      const result = complete('zzz', true, registry, vfs, '/');
      expect(result.matches).toEqual([]);
    });

    it('sorts matches alphabetically', () => {
      const result = complete('c', true, registry, vfs, '/');
      expect(result.matches).toEqual(['cat', 'cd', 'clear', 'cp']);
    });
  });

  describe('path completion', () => {
    beforeEach(() => {
      vfs.write('/home/foo.txt', 'a', '/');
      vfs.write('/home/foobar.txt', 'b', '/');
      vfs.write('/home/bar.txt', 'c', '/');
      vfs.mkdir('/home/mydir', '/');
    });

    it('completes file in current dir', () => {
      const result = complete('f', false, registry, vfs, '/home');
      expect(result.matches).toContain('foo.txt');
      expect(result.matches).toContain('foobar.txt');
    });

    it('returns matching files for partial', () => {
      const result = complete('', false, registry, vfs, '/home');
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('appends trailing slash for directories', () => {
      const result = complete('my', false, registry, vfs, '/home');
      expect(result.matches).toContain('mydir/');
    });

    it('resolves paths with parent directory', () => {
      const result = complete('../home/f', false, registry, vfs, '/tmp');
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('returns empty for nonexistent directory', () => {
      const result = complete('/nonexistent/', false, registry, vfs, '/');
      expect(result.matches).toEqual([]);
    });
  });
});
