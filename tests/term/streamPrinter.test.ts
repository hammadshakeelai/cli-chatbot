import { describe, it, expect } from 'vitest';
import { StreamPrinter } from '@/term/streamPrinter';
import { stripAnsi } from '@/term/ansi';

function render(chunks: string[], width = 60): string {
  let out = '';
  const p = new StreamPrinter((s) => { out += s; }, { width: () => width, indent: '' });
  for (const c of chunks) p.push(c);
  p.end();
  return out;
}

describe('StreamPrinter', () => {
  it('passes plain text through with a trailing newline', () => {
    expect(stripAnsi(render(['hello world']))).toBe('hello world\n');
  });

  it('styles **bold** across chunk boundaries', () => {
    const out = render(['some *', '*bold**', ' text']);
    expect(out).toContain('\x1b[1m');
    expect(stripAnsi(out)).toBe('some bold text\n');
  });

  it('renders inline code without the backticks', () => {
    const out = render(['run `npm test` now']);
    expect(stripAnsi(out)).toBe('run npm test now\n');
  });

  it('turns markdown bullets into glyphs', () => {
    const out = stripAnsi(render(['- one\n- two\n']));
    expect(out).toContain('• one');
    expect(out).toContain('• two');
  });

  it('renders headings without the hashes', () => {
    const out = render(['## Title\nbody\n']);
    expect(stripAnsi(out)).toBe('Title\nbody\n');
    expect(out).toContain('\x1b[1m');
  });

  it('keeps code fences, dropping the fence markers and language', () => {
    const out = stripAnsi(render(['```js\nconst x = 1;\n```\nafter']));
    expect(out).toContain('const x = 1;');
    expect(out).not.toContain('```');
    expect(out).not.toContain('js\n const'.trim());
    expect(out).toContain('after');
  });

  it('word-wraps at the given width', () => {
    const out = stripAnsi(render(['alpha bravo charlie delta echo foxtrot golf'], 20));
    const lines = out.trimEnd().split('\n');
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(20);
  });

  it('prefixes the first line only', () => {
    let out = '';
    const p = new StreamPrinter((s) => { out += s; }, {
      width: () => 60, firstPrefix: '> ', firstPrefixWidth: 2, indent: '  ',
    });
    p.push('one\ntwo');
    p.end();
    const lines = stripAnsi(out).trimEnd().split('\n');
    expect(lines[0]).toBe('> one');
    expect(lines[1]).toBe('  two');
  });
});
