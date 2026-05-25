export interface VFSNode {
  type: 'dir' | 'file';
  name: string;
  children?: Map<string, VFSNode>;
  content?: string;
  mode: number;
  mtime: number;
}

export interface CommandContext {
  args: string[];
  flags: Record<string, string | boolean>;
  cwd: string;
  env: Env;
  vfs: VFS;
  stdin?: AsyncIterable<string>;
  signal: AbortSignal;
  ui: { skin: string; mode: 'dark' | 'light'; cols: number; rows: number };
  emit(chunk: string): void;
}

export type OutputChunk = string;

export interface Command {
  name: string;
  help: string;
  usage?: string;
  run(ctx: CommandContext): AsyncIterable<OutputChunk>;
}

export interface ParsedCommand {
  type: 'command';
  command: string;
  args: string[];
}

import { VFS } from './vfs';
import { Env } from './env';
