import { describe, it, expect } from 'vitest';
import { parse } from '@/kernel/parser';

describe('parser', () => {
  it('parses a simple command', () => {
    const result = parse('ls');
    expect(result).toHaveLength(1);
    expect(result[0]!.command).toBe('ls');
    expect(result[0]!.args).toEqual([]);
  });

  it('parses command with arguments', () => {
    const result = parse('echo hello world');
    expect(result[0]!.command).toBe('echo');
    expect(result[0]!.args).toEqual(['hello', 'world']);
  });

  it('handles quoted arguments', () => {
    const result = parse('echo "hello world"');
    expect(result[0]!.args).toEqual(['hello world']);
  });

  it('handles empty input', () => {
    expect(parse('')).toEqual([]);
    expect(parse('   ')).toEqual([]);
  });

  it('handles command with flags', () => {
    const result = parse('ls -la /home');
    expect(result[0]!.command).toBe('ls');
    expect(result[0]!.args).toEqual(['-la', '/home']);
  });
});
