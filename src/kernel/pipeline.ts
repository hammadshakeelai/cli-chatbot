import type { CommandContext } from './types';
import type { CommandRegistry } from './registry';
import type { VFS } from './vfs';
import type { Env } from './env';
import { parse } from './parser';
import type { SequenceStep, PipelineCmd } from './parser';
import { expandGlob } from './glob';
import { setHelpRegistry } from './commands/help';
import { setHistorySource } from './commands/history';

export interface ExecResult {
  output: string;
  cwd: string;
}

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else if (arg === '--') break;
      else flags[arg.slice(2)] = true;
    } else if (arg.startsWith('-') && arg.length > 1 && arg[0] === '-') {
      for (let i = 1; i < arg.length; i++) {
        flags[arg[i]!] = true;
      }
    }
  }
  return flags;
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
): CommandContext {
  const flags = parseFlags(cmd.args);
  const positional = cmd.args.filter((a) => !a.startsWith('-') || a === '--');
  const expanded = expandArgs(positional, env, vfs, cwd);

  return {
    args: expanded,
    flags,
    cwd,
    env,
    vfs,
    stdin,
    signal,
    ui: { skin: 'default', mode: 'dark', cols: 80, rows: 24 },
    emit: emit ?? (() => {}),
    registry,
  };
}

export async function executeLine(
  line: string,
  kernel: { vfs: VFS; env: Env; registry: CommandRegistry; history: string[] },
  currentCwd: string,
  signal: AbortSignal,
): Promise<{ output: string; newCwd: string }> {
  let output = '';
  let newCwd = currentCwd;

  const sequences = parse(line);
  if (sequences.length === 0) return { output, newCwd };

  let lastExitCode = 0;
  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i]!;
    if (i > 0 && seq.op === '&&' && lastExitCode !== 0) break;

    const result = await executeSequence(seq, kernel, newCwd, signal);
    output += result.output;
    if (result.newCwd !== newCwd) {
      newCwd = result.newCwd;
    }
    lastExitCode = result.exitCode;
  }

  return { output, newCwd };
}

async function executeSequence(
  seq: SequenceStep,
  kernel: { vfs: VFS; env: Env; registry: CommandRegistry; history: string[] },
  cwd: string,
  signal: AbortSignal,
): Promise<{ output: string; newCwd: string; exitCode: number }> {
  let output = '';
  let currentCwd = cwd;
  let exitCode = 0;
  let lastStdin: AsyncIterable<string> | undefined;

  for (let i = 0; i < seq.commands.length; i++) {
    const cmd = seq.commands[i]!;
    const cmdDef = kernel.registry.get(cmd.command);

    if (!cmdDef) {
      output += `command not found: ${cmd.command}\n`;
      exitCode = 1;
      continue;
    }

    const chunks: string[] = [];
    const emit = (chunk: string) => {
      if (chunk.startsWith('__cd__')) {
        currentCwd = chunk.slice(6);
      } else {
        chunks.push(chunk);
      }
    };

    const isLast = i === seq.commands.length - 1;
    const hasPipeToNext = !isLast;
    const hasRedirect = cmd.redirect !== undefined;

    let stdin: AsyncIterable<string> | undefined;
    if (i > 0 && lastStdin) {
      stdin = lastStdin;
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

    const ctx = buildContext(cmd, seq, currentCwd, kernel.env, kernel.vfs, signal, kernel.registry, stdin, emit);

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
          chunks.push(chunk);
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

setHelpRegistry({} as CommandRegistry);
setHistorySource([]);

export { parse };
