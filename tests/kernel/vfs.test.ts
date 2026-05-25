import { describe, it, expect } from 'vitest';
import { VFS } from '@/kernel/vfs';

describe('VFS', () => {
  it('starts with seeded directories', () => {
    const vfs = new VFS();
    const home = vfs.list('/home/user', '/');
    expect(home).toBeDefined();
    expect(home!.some((n) => n.name === 'welcome.txt')).toBe(true);
  });

  it('mkdir creates a directory', () => {
    const vfs = new VFS();
    expect(vfs.mkdir('/home/user/test', '/')).toBe(true);
    expect(vfs.list('/home/user/test', '/')).toEqual([]);
  });

  it('mkdir -p creates parent directories', () => {
    const vfs = new VFS();
    expect(vfs.mkdir('/home/user/a/b/c', '/', { parents: true })).toBe(true);
    expect(vfs.list('/home/user/a/b/c', '/')).toEqual([]);
  });

  it('mkdir fails if already exists', () => {
    const vfs = new VFS();
    expect(vfs.mkdir('/home/user', '/')).toBe(false);
  });

  it('write creates a file', () => {
    const vfs = new VFS();
    expect(vfs.write('/home/user/foo.txt', 'hello', '/')).toBe(true);
    expect(vfs.read('/home/user/foo.txt', '/')).toBe('hello');
  });

  it('read returns undefined for missing file', () => {
    const vfs = new VFS();
    expect(vfs.read('/nonexistent', '/')).toBeUndefined();
  });

  it('read resolves ~ to home', () => {
    const vfs = new VFS();
    expect(vfs.read('~/welcome.txt', '/')).toBeDefined();
  });

  it('read resolves relative paths', () => {
    const vfs = new VFS();
    expect(vfs.read('welcome.txt', '/home/user')).toBeDefined();
  });

  it('unlink removes a file', () => {
    const vfs = new VFS();
    vfs.write('/home/user/delete.me', 'bye', '/');
    expect(vfs.exists('/home/user/delete.me', '/')).toBe(true);
    expect(vfs.unlink('/home/user/delete.me', '/')).toBe(true);
    expect(vfs.exists('/home/user/delete.me', '/')).toBe(false);
  });

  it('unlink refuses non-empty dir without recursive', () => {
    const vfs = new VFS();
    expect(vfs.unlink('/home/user', '/')).toBe(false);
  });

  it('unlink -r removes a directory tree', () => {
    const vfs = new VFS();
    vfs.mkdir('/home/user/sub', '/');
    vfs.write('/home/user/sub/a.txt', 'a', '/');
    expect(vfs.unlink('/home/user/sub', '/', { recursive: true })).toBe(true);
    expect(vfs.exists('/home/user/sub', '/')).toBe(false);
  });

  it('move renames a file', () => {
    const vfs = new VFS();
    vfs.write('/home/user/old.txt', 'data', '/');
    expect(vfs.move('/home/user/old.txt', '/home/user/new.txt', '/')).toBe(true);
    expect(vfs.exists('/home/user/old.txt', '/')).toBe(false);
    expect(vfs.exists('/home/user/new.txt', '/')).toBe(true);
  });

  it('copy duplicates a file', () => {
    const vfs = new VFS();
    vfs.write('/home/user/src.txt', 'data', '/');
    expect(vfs.copy('/home/user/src.txt', '/home/user/dst.txt', '/')).toBe(true);
    expect(vfs.read('/home/user/dst.txt', '/')).toBe('data');
  });

  it('stat returns node info', () => {
    const vfs = new VFS();
    const node = vfs.stat('/home/user', '/');
    expect(node).toBeDefined();
    expect(node!.type).toBe('dir');
    expect(node!.name).toBe('user');
  });

  it('serialize and restore', () => {
    const vfs = new VFS();
    vfs.write('/home/user/test.txt', 'hello', '/');
    const data = vfs.toJSON();
    const vfs2 = new VFS();
    vfs2.fromJSON(data);
    expect(vfs2.read('/home/user/test.txt', '/')).toBe('hello');
  });
});
