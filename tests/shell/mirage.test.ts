import { describe, it, expect } from 'vitest';
import { mirageCmd } from '@/shell/commands/fun-cmds';
import type { ShellCtx } from '@/shell/types';
import { stripAnsi } from '@/term/ansi';
import { APP_VERSION } from '@/lib/constants';

function run(args: string[] = [], flags: string[] = []) {
  let out = '';
  const ctx = {
    args,
    flags: new Set(flags),
    out: (t: string) => { out += t; },
  } as unknown as ShellCtx;
  const code = mirageCmd.run(ctx);
  return { text: stripAnsi(out), code };
}

describe('mirage command', () => {
  it('prints the ASCII banner by default', () => {
    const { text, code } = run();
    expect(code).toBe(0);
    expect(text).toContain('█'); // wordmark art
    expect(text).toContain("a PowerShell that isn't there");
  });

  it('--banner prints the same banner', () => {
    expect(run(['--banner']).text).toContain('█');
  });

  it('--version / -v print the version without art', () => {
    const long = run(['--version']).text;
    expect(long.trim()).toBe(`Mirage Terminal v${APP_VERSION}`);
    expect(long).not.toContain('█');
    expect(run([], ['v']).text.trim()).toBe(`Mirage Terminal v${APP_VERSION}`);
  });

  it('--help / -h print usage', () => {
    expect(run(['--help']).text).toContain('Usage: mirage');
    expect(run([], ['h']).text).toContain('Usage: mirage');
  });
});
