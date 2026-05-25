import { describe, it, expect } from 'vitest';
import { History } from '@/kernel/history';

describe('History', () => {
  it('starts empty', () => {
    const h = new History();
    expect(h.getAll()).toEqual([]);
  });

  it('adds a line', () => {
    const h = new History();
    h.add('ls');
    expect(h.getAll()).toEqual(['ls']);
  });

  it('ignores empty lines', () => {
    const h = new History();
    h.add('');
    h.add('   ');
    expect(h.getAll()).toEqual([]);
  });

  it('deduplicates consecutive duplicates', () => {
    const h = new History();
    h.add('ls');
    h.add('ls');
    expect(h.getAll()).toEqual(['ls']);
  });

  it('navigates back and forward', () => {
    const h = new History();
    h.add('ls');
    h.add('pwd');
    h.add('echo hi');
    expect(h.back()).toBe('echo hi');
    expect(h.back()).toBe('pwd');
    expect(h.back()).toBe('ls');
    expect(h.back()).toBe('ls');
    expect(h.forward()).toBe('pwd');
    expect(h.forward()).toBe('echo hi');
    expect(h.forward()).toBeUndefined();
  });

  it('resetIndex sets index to end', () => {
    const h = new History();
    h.add('a');
    h.add('b');
    h.back();
    h.resetIndex();
    expect(h.forward()).toBeUndefined();
  });

  it('caps at max size', () => {
    const h = new History(3);
    h.add('a');
    h.add('b');
    h.add('c');
    h.add('d');
    expect(h.getAll()).toEqual(['b', 'c', 'd']);
  });

  it('clear removes all', () => {
    const h = new History();
    h.add('a');
    h.clear();
    expect(h.getAll()).toEqual([]);
  });

  it('serialize and restore', () => {
    const h = new History();
    h.add('ls');
    h.add('pwd');
    const data = h.toJSON();
    const h2 = new History();
    h2.fromJSON(data);
    expect(h2.getAll()).toEqual(['ls', 'pwd']);
  });
});
