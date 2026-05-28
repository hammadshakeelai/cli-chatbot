import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { expandGlob } from '@/kernel/glob';

describe('glob expansion', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.write('/home/foo.txt', 'a', '/');
    vfs.write('/home/bar.txt', 'b', '/');
    vfs.write('/home/baz.js', 'c', '/');
    vfs.write('/home/qux.md', 'd', '/');
    vfs.mkdir('/home/sub', '/');
    vfs.write('/home/sub/deep.txt', 'e', '/');
  });

  it('passes through patterns without wildcards', () => {
    expect(expandGlob('/home/foo.txt', vfs, '/')).toEqual(['/home/foo.txt']);
  });

  it('expands * glob', () => {
    const result = expandGlob('/home/*.txt', vfs, '/');
    expect(result).toContain('/home/foo.txt');
    expect(result).toContain('/home/bar.txt');
    expect(result).not.toContain('/home/baz.js');
  });

  it('expands ? glob for same extension', () => {
    const result = expandGlob('/home/ba?.txt', vfs, '/');
    expect(result).toContain('/home/bar.txt');
    // baz.js has .js not .txt so no match
    expect(result).not.toContain('/home/baz.js');
    expect(result).not.toContain('/home/foo.txt');
  });

  it('matches all entries with *', () => {
    const result = expandGlob('/home/*', vfs, '/');
    expect(result).toContain('/home/foo.txt');
    expect(result).toContain('/home/bar.txt');
    expect(result).toContain('/home/baz.js');
    expect(result).toContain('/home/sub');
  });

  it('returns pattern unchanged if no matches', () => {
    expect(expandGlob('/home/nope*', vfs, '/')).toEqual(['/home/nope*']);
  });

  it('handles relative path with glob', () => {
    const result = expandGlob('*.txt', vfs, '/home');
    expect(result).toContain('foo.txt');
    expect(result).toContain('bar.txt');
  });

  it('handles dot in filename', () => {
    vfs.write('/home/foo.test.txt', 'x', '/');
    const result = expandGlob('/home/*.txt', vfs, '/');
    expect(result).toContain('/home/foo.txt');
    expect(result).toContain('/home/foo.test.txt');
  });
});
