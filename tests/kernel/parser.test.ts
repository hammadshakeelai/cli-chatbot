import { describe, it, expect } from 'vitest';
import { parse } from '@/kernel/parser';

describe('parser', () => {
  it('parses a simple command', () => {
    const result = parse('ls');
    expect(result).toHaveLength(1);
    expect(result[0]!.commands).toHaveLength(1);
    expect(result[0]!.commands[0]!.command).toBe('ls');
  });

  it('parses command with arguments', () => {
    const result = parse('echo hello world');
    const cmd = result[0]!.commands[0]!;
    expect(cmd.command).toBe('echo');
    expect(cmd.args).toEqual(['hello', 'world']);
  });

  it('handles quoted arguments', () => {
    const result = parse('echo "hello world"');
    expect(result[0]!.commands[0]!.args).toEqual(['hello world']);
  });

  it('handles empty input', () => {
    expect(parse('')).toEqual([]);
    expect(parse('   ')).toEqual([]);
  });

  it('parses pipeline with |', () => {
    const result = parse('ls | grep foo');
    expect(result).toHaveLength(1);
    expect(result[0]!.commands).toHaveLength(2);
    expect(result[0]!.commands[0]!.command).toBe('ls');
    expect(result[0]!.commands[1]!.command).toBe('grep');
    expect(result[0]!.commands[1]!.args).toEqual(['foo']);
  });

  it('parses && sequence', () => {
    const result = parse('mkdir x && cd x');
    expect(result).toHaveLength(2);
    expect(result[0]!.commands[0]!.command).toBe('mkdir');
    expect(result[1]!.commands[0]!.command).toBe('cd');
    // second sequence gated by &&
    expect(result[1]!.op).toBe('&&');
    // first seq is ';' (no gate before it)
    expect(result[0]!.op).toBe(';');
  });

  it('parses ; separator', () => {
    const result = parse('echo a ; echo b');
    expect(result).toHaveLength(2);
    expect(result[0]!.op).toBe(';');
    expect(result[1]!.op).toBe(';');
  });

  it('parses redirect >', () => {
    const result = parse('echo hello > file.txt');
    const cmd = result[0]!.commands[0]!;
    expect(cmd.command).toBe('echo');
    expect(cmd.redirect).toBeDefined();
    expect(cmd.redirect!.op).toBe('>');
    expect(cmd.redirect!.file).toBe('file.txt');
  });

  it('parses append >>', () => {
    const result = parse('echo hello >> file.txt');
    const cmd = result[0]!.commands[0]!;
    expect(cmd.redirect!.op).toBe('>>');
    expect(cmd.redirect!.file).toBe('file.txt');
  });
});
