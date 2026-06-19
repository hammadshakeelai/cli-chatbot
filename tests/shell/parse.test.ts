import { describe, it, expect } from 'vitest';
import { parseLine } from '@/shell/parse';

describe('parseLine', () => {
  it('parses a simple command', () => {
    const [s] = parseLine('dir C:\\Users');
    expect(s!.pipeline[0]).toMatchObject({ name: 'dir', args: ['C:\\Users'] });
  });

  it('handles quotes (single, double, backtick escape)', () => {
    const [s] = parseLine(`echo "hello world" 'and more' gr\`"ey`);
    expect(s!.pipeline[0]!.args).toEqual(['hello world', 'and more', 'gr"ey']);
  });

  it('splits pipelines', () => {
    const [s] = parseLine('dir | sls demo | cat');
    expect(s!.pipeline.map((c) => c.name)).toEqual(['dir', 'sls', 'cat']);
    expect(s!.pipeline[1]!.args).toEqual(['demo']);
  });

  it('parses redirects', () => {
    const [s] = parseLine('echo hi > out.txt');
    expect(s!.pipeline[0]!.redirect).toEqual({ file: 'out.txt', append: false });
    const [s2] = parseLine('echo hi >> out.txt');
    expect(s2!.pipeline[0]!.redirect).toEqual({ file: 'out.txt', append: true });
  });

  it('splits statements on ; and &&', () => {
    const stmts = parseLine('cd projects; dir && echo ok');
    expect(stmts).toHaveLength(3);
    expect(stmts[0]!.op).toBe(';');
    expect(stmts[1]!.op).toBe(';');
    expect(stmts[2]!.op).toBe('&&');
    expect(stmts[2]!.pipeline[0]!.name).toBe('echo');
  });

  it('ignores empty input', () => {
    expect(parseLine('')).toEqual([]);
    expect(parseLine('   ')).toEqual([]);
  });
});
