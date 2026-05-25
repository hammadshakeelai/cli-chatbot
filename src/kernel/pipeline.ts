import type { CommandContext } from './types';
import type { CommandRegistry } from './registry';
import type { VFS } from './vfs';
import type { Env } from './env';
import { parse } from './parser';
import { setHelpRegistry } from './commands/help';
import { setHistorySource } from './commands/history';

export interface ExecResult {
  output: string;
  cwd: string;
}

function parseFlags(args: string[]): { flags: Record<string, string | boolean>; positional: string[] } {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        flags[arg.slice(2)] = true;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (let i = 1; i < arg.length; i++) {
        flags[arg[i]!] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

export function createContext(
  args: string[],
  cwd: string,
  env: Env,
  vfs: VFS,
  signal: AbortSignal,
  emit: (chunk: string) => void,
): CommandContext {
  const { flags } = parseFlags(args);
  return {
    args: args.filter((a) => !a.startsWith('-')),
    flags,
    cwd,
    env,
    vfs,
    signal,
    ui: { skin: 'default', mode: 'dark', cols: 80, rows: 24 },
    emit,
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
  let currentCwdMutable = currentCwd;

  const commands = parse(line);
  if (commands.length === 0) return { output, newCwd };

  for (const cmd of commands) {
    const cmdDef = kernel.registry.get(cmd.command);
    if (!cmdDef) {
      output += `command not found: ${cmd.command}\n`;
      continue;
    }

    const chunks: string[] = [];
    const emit = (chunk: string) => {
      if (chunk.startsWith('__cd__')) {
        currentCwdMutable = chunk.slice(6);
        newCwd = currentCwdMutable;
      } else {
        chunks.push(chunk);
      }
    };

    const ctx = createContext(cmd.args, currentCwdMutable, kernel.env, kernel.vfs, signal, emit);

    for await (const chunk of cmdDef.run(ctx)) {
      emit(chunk);
    }

    output += chunks.join('');
  }

  return { output, newCwd: newCwd };
}

setHelpRegistry({} as CommandRegistry);
setHistorySource([]);

export { parse };
