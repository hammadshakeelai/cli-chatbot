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
  env: import('./env').Env;
  vfs: import('./vfs').VFS;
  stdin?: AsyncIterable<string>;
  signal: AbortSignal;
  ui: { skin: string; mode: 'dark' | 'light'; cols: number; rows: number };
  emit(chunk: string): void;
  registry?: import('./registry').CommandRegistry;
}

export type OutputChunk = string;

export interface Command {
  name: string;
  help: string;
  usage?: string;
  run(ctx: CommandContext): AsyncIterable<OutputChunk>;
}
