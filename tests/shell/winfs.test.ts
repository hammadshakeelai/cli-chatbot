import { describe, it, expect } from 'vitest';
import { WinFS } from '@/shell/winfs';

const CWD = 'C:\\Users\\user';

describe('WinFS', () => {
  it('resolves relative, absolute, ~ and mixed separators', () => {
    const fs = new WinFS();
    expect(fs.resolve('.', CWD)).toBe(CWD);
    expect(fs.resolve('..', CWD)).toBe('C:\\Users');
    expect(fs.resolve('~', CWD)).toBe(CWD);
    expect(fs.resolve('~/Documents', 'C:\\')).toBe(CWD + '\\Documents');
    expect(fs.resolve('C:/Windows/System32', CWD)).toBe('C:\\Windows\\System32');
    expect(fs.resolve('projects\\demo-app', CWD)).toBe(CWD + '\\projects\\demo-app');
    expect(fs.resolve('\\Temp', CWD)).toBe('C:\\Temp');
  });

  it('is case-insensitive but case-preserving', () => {
    const fs = new WinFS();
    expect(fs.canonical('c:\\users\\USER\\documents', 'C:\\')).toBe(CWD + '\\Documents');
    expect(fs.exists('C:\\WINDOWS\\system32', 'C:\\')).toBe(true);
  });

  it('reads seeded files and writes new ones', () => {
    const fs = new WinFS();
    expect(fs.read('notes.txt', CWD)).toContain('simulation');
    expect(fs.write('hello.txt', 'hi', CWD)).toBeUndefined();
    expect(fs.read('hello.txt', CWD)).toBe('hi');
    expect(fs.write('hello.txt', ' there', CWD, true)).toBeUndefined();
    expect(fs.read('hello.txt', CWD)).toBe('hi there');
  });

  it('mkdir creates parents; remove respects recursion', () => {
    const fs = new WinFS();
    expect(fs.mkdir('a\\b\\c', CWD)).toBeUndefined();
    expect(fs.exists('a\\b\\c', CWD)).toBe(true);
    expect(fs.remove('a', CWD, false)).toContain('children');
    expect(fs.remove('a', CWD, true)).toBeUndefined();
    expect(fs.exists('a', CWD)).toBe(false);
  });

  it('copies into directories keeping the name', () => {
    const fs = new WinFS();
    expect(fs.copy('notes.txt', 'Documents', CWD)).toBeUndefined();
    expect(fs.exists('Documents\\notes.txt', CWD)).toBe(true);
  });

  it('moves and renames', () => {
    const fs = new WinFS();
    expect(fs.move('todo.md', 'done.md', CWD)).toBeUndefined();
    expect(fs.exists('todo.md', CWD)).toBe(false);
    expect(fs.read('done.md', CWD)).toContain('TODO');
  });

  it('lists directories sorted dirs-first', () => {
    const fs = new WinFS();
    const items = fs.list('.', CWD)!;
    expect(items[0]!.kind).toBe('dir');
    const names = items.map((i) => i.name);
    expect(names).toContain('notes.txt');
  });
});
