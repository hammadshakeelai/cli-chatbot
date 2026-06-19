import type { Terminal } from '@xterm/xterm';

/** Terminal IO surface handed to REPLs and commands. */
export interface TermIO {
  term: Terminal;
  /** Write text; `\n` is normalized to `\r\n`. */
  write(s: string): void;
  writeln(s?: string): void;
  clear(): void;
  cols(): number;
  rows(): number;
  setTitle(title: string): void;
  /** Abort signal of the currently running command. */
  signal(): AbortSignal;
  /** Abort-aware sleep (resolves early if interrupted). */
  sleep(ms: number): Promise<void>;
}

export interface Completion {
  items: string[];
  /** Index in the line where the completed word starts. */
  replaceStart: number;
}

/** Host controls a REPL can use (launch agents, exit, close tab). */
export interface ReplHost {
  pushRepl(repl: Repl): Promise<void>;
  popRepl(): void;
  closeTab(): void;
}

export interface Repl {
  id: string;
  /** Current prompt (may contain ANSI). */
  prompt(): string;
  /** Dim hint shown while the input line is empty. */
  ghost?(): string | undefined;
  /** Called when this REPL becomes the active one. `firstTime` = just pushed. */
  onAttach(io: TermIO, firstTime: boolean): void | Promise<void>;
  /** Handle a submitted line. */
  run(line: string, io: TermIO, host: ReplHost): Promise<void>;
  complete?(line: string, cursor: number): Completion | undefined;
  /** Ctrl+C pressed while idle (input line already cleared). Return 'exit' to pop. */
  onIdleInterrupt?(io: TermIO): 'exit' | void;
  history: string[];
}
