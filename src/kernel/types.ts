export interface VFSNode {
  type: 'dir' | 'file';
  name: string;
  children?: Map<string, VFSNode>;
  content?: string;
  mode: number;
  mtime: number;
}

export interface MutableState {
  chatMessages: import('@/providers/types').ChatMsg[];
  chatModel?: string;
  chatPersona?: string;
  skin?: string;
  mode?: 'dark' | 'light';
  fxEnabled?: boolean;
  soundFx?: boolean;
}

export interface CommandContext {
  args: string[];
  flags: Record<string, string | boolean>;
  cwd: string;
  env: import('./env').Env;
  vfs: import('./vfs').VFS;
  stdin?: AsyncIterable<string>;
  signal: AbortSignal;
  ui: { skin: string; mode: 'dark' | 'light'; cols: number; rows: number; reducedMotion: boolean };
  emit(chunk: string): void;
  registry?: import('./registry').CommandRegistry;
  // Mutable state shared between kernel and store
  state: MutableState;
  chatModel?: string;
  chatPersona?: string;
  byokKey?: string;
}

export type OutputChunk = string;

export interface Command {
  name: string;
  help: string;
  usage?: string;
  run(ctx: CommandContext): AsyncIterable<OutputChunk>;
}
