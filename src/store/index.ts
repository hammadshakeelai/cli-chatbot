import { create } from 'zustand';
import { VFS, Env, History, CommandRegistry, executeLine } from '@/kernel';
import { lsCommand, cdCommand, pwdCommand, catCommand, echoCommand, mkdirCommand, touchCommand, rmCommand, mvCommand, cpCommand, clearCommand, whoamiCommand, helpCommand, manCommand, historyCommand, aiCommand, setHelpRegistry, setHistorySource } from '@/kernel';
import { grepCommand } from '@/kernel/commands/grep';
import { headCommand } from '@/kernel/commands/head';
import { tailCommand } from '@/kernel/commands/tail';
import { wcCommand } from '@/kernel/commands/wc';
import { envCommand } from '@/kernel/commands/env';
import { exportCmdCommand } from '@/kernel/commands/export-cmd';
import { dateCommand } from '@/kernel/commands/date';
import { calCommand } from '@/kernel/commands/cal';
import { unameCommand } from '@/kernel/commands/uname';
import { treeCommand } from '@/kernel/commands/tree';
import { whichCommand } from '@/kernel/commands/which';
import { dfCommand } from '@/kernel/commands/df';
import { uptimeCommand } from '@/kernel/commands/uptime';
import { psCommand } from '@/kernel/commands/ps';
import { neofetchCommand } from '@/kernel/commands/neofetch';

function createRegistry(): CommandRegistry {
  const reg = new CommandRegistry();
  const commands = [
    lsCommand, cdCommand, pwdCommand, catCommand, echoCommand,
    mkdirCommand, touchCommand, rmCommand, mvCommand, cpCommand,
    clearCommand, whoamiCommand, helpCommand, manCommand, historyCommand,
    aiCommand, grepCommand, headCommand, tailCommand, wcCommand,
    envCommand, exportCmdCommand, dateCommand, calCommand, unameCommand,
    treeCommand, whichCommand, dfCommand, uptimeCommand, psCommand,
    neofetchCommand,
  ];
  for (const cmd of commands) reg.register(cmd);
  setHelpRegistry(reg);
  return reg;
}

interface Session {
  cwd: string;
  env: Env;
  history: History;
}

interface MirageState {
  version: string;
  vfs: VFS;
  registry: CommandRegistry;
  sessions: Record<string, Session>;
  activeSessionId: string;
  _hydrated: boolean;

  setHydrated: (v: boolean) => void;
  execute: (line: string) => Promise<{ output: string; newCwd: string }>;
  getActiveSession: () => Session;
  getHistoryItems: () => string[];
  addHistory: (line: string) => void;
  navigateHistory: (dir: 'back' | 'forward') => string | undefined;
  resetHistoryIndex: () => void;
}

const DEFAULT_SESSION_ID = 'default';

const vfs = new VFS();
const registry = createRegistry();

const sessions: Record<string, Session> = {
  [DEFAULT_SESSION_ID]: {
    cwd: '/home/user',
    env: new Env(),
    history: new History(),
  },
};

setHistorySource(sessions[DEFAULT_SESSION_ID]!.history.getAll());

export const useMirageStore = create<MirageState>((set, get) => ({
  version: '0.1.0',
  vfs,
  registry,
  sessions,
  activeSessionId: DEFAULT_SESSION_ID,
  _hydrated: false,

  setHydrated: (v) => set({ _hydrated: v }),

  getActiveSession: () => {
    return get().sessions[get().activeSessionId]!;
  },

  getHistoryItems: () => {
    return get().getActiveSession().history.getAll();
  },

  addHistory: (line) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;
    session.history.add(line);
    setHistorySource(session.history.getAll());
  },

  navigateHistory: (dir) => {
    const session = get().getActiveSession();
    return dir === 'back' ? session.history.back() : session.history.forward();
  },

  resetHistoryIndex: () => {
    get().getActiveSession().history.resetIndex();
  },

  execute: async (line) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;

    const result = await executeLine(
      line,
      { vfs: state.vfs, env: session.env, registry: state.registry, history: session.history.getAll() },
      session.cwd,
      new AbortController().signal,
    );

    if (result.newCwd !== session.cwd) {
      session.cwd = result.newCwd;
    }

    return result;
  },
}));
