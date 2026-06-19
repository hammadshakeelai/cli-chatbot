import type { WinFS } from './winfs';
import type { TermIO, ReplHost } from '@/term/types';

export interface ShellState {
  cwd: string;
  env: Map<string, string>;
  lastExit: number;
  history: string[];
}

export interface ShellCtx {
  /** Positional args (flags removed, globs expanded). */
  args: string[];
  /** Lowercased flag words (`-Recurse` → "recurse"; `-la` → "l","a"). */
  flags: Set<string>;
  fs: WinFS;
  state: ShellState;
  io: TermIO;
  /** Pipeline-aware stdout — buffered between pipe stages. */
  out(text: string): void;
  /** Piped input from the previous stage (full text). */
  stdin?: string;
  host: ReplHost;
  signal: AbortSignal;
  sleep(ms: number): Promise<void>;
}

export interface ShellCommand {
  /** Canonical PowerShell name (e.g. `Get-ChildItem`). */
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  /** Fullscreen/animated commands write straight to the terminal; pipes are ignored. */
  interactive?: boolean;
  /** Hide from Get-Command/help listings (easter eggs). */
  hidden?: boolean;
  run(ctx: ShellCtx): Promise<number | void> | number | void;
}

/** PowerShell 5.1-style red error block. */
export function psError(
  ctx: ShellCtx,
  invoked: string,
  message: string,
  opts?: { category?: string; errorId?: string; exception?: string; target?: string },
): void {
  const red = '\x1b[91m';
  const rst = '\x1b[0m';
  const category = opts?.category ?? 'ObjectNotFound';
  const errorId = opts?.errorId ?? 'ItemNotFoundException';
  const exception = opts?.exception ?? `[${invoked}]`;
  const target = opts?.target ?? '';
  ctx.out(
    `${red}${invoked} : ${message}\n` +
    `At line:1 char:1\n` +
    `+ ${invoked}\n` +
    `+ ${'~'.repeat(Math.max(2, invoked.length))}\n` +
    `    + CategoryInfo          : ${category}: (${target}:String) ${exception}, ${errorId}\n` +
    `    + FullyQualifiedErrorId : ${errorId}\n${rst}`,
  );
}

export function fmtDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${String(m).padStart(2)}/${String(day).padStart(2, '0')}/${y}  ${String(h).padStart(2)}:${min} ${ampm}`;
}
