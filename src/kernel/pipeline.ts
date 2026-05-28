import type { CommandContext } from './types';
import type { CommandRegistry } from './registry';
import type { VFS } from './vfs';
import type { Env } from './env';
import { parse } from './parser';
import type { SequenceStep, PipelineCmd } from './parser';
import { expandGlob } from './glob';

export interface ExecResult {
  output: string;
  cwd: string;
}

function parseFlags(args: string[]): { flags: Record<string, string | boolean>; rest: string[] } {
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg === '--') { i++; break; }
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else if (i + 1 < args.length && !args[i + 1]!.startsWith('-')) {
        flags[arg.slice(2)] = args[++i]!;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const ch = arg[1]!;
      if (arg.length === 2 && i + 1 < args.length && !args[i + 1]!.startsWith('-')) {
        flags[ch] = args[++i]!;
      } else {
        flags[ch] = arg.length === 2 ? true : arg.slice(2);
      }
    } else {
      rest.push(arg);
    }
    i++;
  }
  // Collect remaining after --
  while (i < args.length) rest.push(args[i++]!);
  return { flags, rest };
}

function expandArgs(args: string[], env: Env, vfs: VFS, cwd: string): string[] {
  const expanded: string[] = [];
  for (const arg of args) {
    const withEnv = env.expand(arg);
    const globbed = expandGlob(withEnv, vfs, cwd);
    expanded.push(...globbed);
  }
  return expanded;
}

export function buildContext(
  cmd: PipelineCmd,
  _sequence: SequenceStep,
  cwd: string,
  env: Env,
  vfs: VFS,
  signal: AbortSignal,
  registry: CommandRegistry,
  stdin?: AsyncIterable<string>,
  emit?: (chunk: string) => void,
  extra?: Partial<Pick<CommandContext, 'state' | 'chatModel' | 'chatPersona' | 'byokKey'>>,
): CommandContext {
  const { flags, rest: positional } = parseFlags(cmd.args);
  const expanded = expandArgs(positional, env, vfs, cwd);

  return {
    args: expanded,
    flags,
    cwd,
    env,
    vfs,
    stdin,
    signal,
    ui: { skin: 'default', mode: 'dark', cols: 80, rows: 24, reducedMotion: false },
    emit: emit ?? (() => {}),
    registry,
    state: extra?.state ?? { chatMessages: [] },
    ...extra,
  };
}

export async function executeLine(
  line: string,
  kernel: {
    vfs: VFS;
    env: Env;
    registry: CommandRegistry;
    history: string[];
    chatModel?: string;
    chatPersona?: string;
    byokKey?: string;
    _state?: import('./types').MutableState;
  },
  currentCwd: string,
  signal: AbortSignal,
  onOutput?: (chunk: string) => void,
  onFallthrough?: (cmd: string, args: string[]) => Promise<string | false | undefined>,
): Promise<{ output: string; newCwd: string; state?: import('./types').MutableState }> {
  let output = '';
  let newCwd = currentCwd;
  const state = kernel._state ?? { chatMessages: [] } as import('./types').MutableState;

  const sequences = parse(line);
  if (sequences.length === 0) return { output, newCwd, state };

  let lastExitCode = 0;
  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i]!;
    if (i > 0 && seq.op === '&&' && lastExitCode !== 0) break;

    const result = await executeSequence(seq, kernel, newCwd, signal, onOutput, i, state, onFallthrough);
    output += result.output;
    if (result.newCwd !== newCwd) {
      newCwd = result.newCwd;
    }
    lastExitCode = result.exitCode;
  }

  return { output, newCwd, state };
}

async function executeSequence(
  seq: SequenceStep,
  kernel: {
    vfs: VFS;
    env: Env;
    registry: CommandRegistry;
    history: string[];
    chatModel?: string;
    chatPersona?: string;
    byokKey?: string;
  },
  cwd: string,
  signal: AbortSignal,
  onOutput?: (chunk: string) => void,
  _seqIndex?: number,
  _state?: import('./types').MutableState,
  onFallthrough?: (cmd: string, args: string[]) => Promise<string | false | undefined>,
): Promise<{ output: string; newCwd: string; exitCode: number }> {
  let output = '';
  let currentCwd = cwd;
  let exitCode = 0;
  let lastStdin: AsyncIterable<string> | undefined;

  for (let i = 0; i < seq.commands.length; i++) {
    const cmd = seq.commands[i]!;
    const cmdDef = kernel.registry.get(cmd.command);

    if (!cmdDef) {
      if (onFallthrough) {
        const cmdArgs = cmd.args.filter((a) => !a.startsWith('-'));
        const fallthroughResult = await onFallthrough(cmd.command, cmdArgs);
        if (fallthroughResult !== undefined && fallthroughResult !== false) {
          output += fallthroughResult;
          continue;
        }
      }
      output += `command not found: ${cmd.command}\n`;
      exitCode = 1;
      continue;
    }

    const chunks: string[] = [];
    const emit = (chunk: string) => {
      if (chunk.startsWith('__cd__')) {
        currentCwd = chunk.slice(6);
      } else if (chunk.startsWith('__chat_')) {
        // handled by store
      } else {
        chunks.push(chunk);
      }
    };

    const streamEmit = (chunk: string) => {
      emit(chunk);
      if (!chunk.startsWith('__chat_')) onOutput?.(chunk);
    };

    const isLast = i === seq.commands.length - 1;
    const hasPipeToNext = !isLast;
    const hasRedirect = cmd.redirect !== undefined;
    const hasInputRedirect = cmd.inputRedirect !== undefined;

    let stdin: AsyncIterable<string> | undefined;
    if (i > 0 && lastStdin) {
      stdin = lastStdin;
    }

    if (hasInputRedirect) {
      const target = cmd.inputRedirect!;
      const resolved = kernel.vfs.resolve(target.file, currentCwd);
      const content = kernel.vfs.read(resolved, '/') ?? '';
      const lines = content.split('\n');
      let idx = 0;
      stdin = {
        [Symbol.asyncIterator]() {
          return {
            next: () => {
              if (idx < lines.length) {
                const val = idx < lines.length - 1 ? lines[idx++]! + '\n' : lines[idx++]!;
                return Promise.resolve({ value: val, done: false });
              }
              return Promise.resolve({ value: undefined as unknown as string, done: true });
            },
          };
        },
      };
    }

    let pipeBuffer: string[] = [];
    const pipeStream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        let idx = 0;
        return {
          next: () => {
            if (idx < pipeBuffer.length) {
              return Promise.resolve({ value: pipeBuffer[idx++]!, done: false });
            }
            return Promise.resolve({ value: undefined as unknown as string, done: true });
          },
        };
      },
    };

    const ctx = buildContext(cmd, seq, currentCwd, kernel.env, kernel.vfs, signal, kernel.registry, stdin, streamEmit, {
      state: _state,
      chatModel: kernel.chatModel,
      chatPersona: kernel.chatPersona,
      byokKey: kernel.byokKey,
    });

    try {
      for await (const chunk of cmdDef.run(ctx)) {
        if (hasRedirect) {
          const target = cmd.redirect!;
          const resolved = kernel.vfs.resolve(target.file, currentCwd);
          const existing = kernel.vfs.read(resolved, '/') ?? '';
          if (target.op === '>>') {
            kernel.vfs.write(resolved, existing + chunk, '/');
          } else {
            kernel.vfs.write(resolved, chunk, '/');
          }
        } else if (hasPipeToNext) {
          pipeBuffer.push(chunk);
        } else {
          // Real-time streaming for animation commands
          onOutput?.(chunk);
          // Only buffer when not streaming to avoid giant return strings
          if (!onOutput) chunks.push(chunk);
        }
      }
    } catch {
      exitCode = 1;
    }

    lastStdin = pipeBuffer.length > 0 ? pipeStream : undefined;
    output += chunks.join('');
  }

  return { output, newCwd: currentCwd, exitCode };
}




export { parse };
