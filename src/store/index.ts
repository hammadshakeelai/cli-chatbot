import { create } from 'zustand';
import { VFS, Env, History, CommandRegistry, executeLine, setHelpRegistry, setHistorySource } from '@/kernel';
import { lsCommand } from '@/kernel/commands/ls';
import { cdCommand } from '@/kernel/commands/cd';
import { pwdCommand } from '@/kernel/commands/pwd';
import { catCommand } from '@/kernel/commands/cat';
import { echoCommand } from '@/kernel/commands/echo';
import { mkdirCommand } from '@/kernel/commands/mkdir';
import { touchCommand } from '@/kernel/commands/touch';
import { rmCommand } from '@/kernel/commands/rm';
import { mvCommand } from '@/kernel/commands/mv';
import { cpCommand } from '@/kernel/commands/cp';
import { clearCommand } from '@/kernel/commands/clear';
import { whoamiCommand } from '@/kernel/commands/whoami';
import { helpCommand } from '@/kernel/commands/help';
import { manCommand } from '@/kernel/commands/man';
import { historyCommand } from '@/kernel/commands/history';
import { aiCommand } from '@/kernel/ai/aiCommand';

function createRegistry(): CommandRegistry {
  const reg = new CommandRegistry();
  reg.register(lsCommand);
  reg.register(cdCommand);
  reg.register(pwdCommand);
  reg.register(catCommand);
  reg.register(echoCommand);
  reg.register(mkdirCommand);
  reg.register(touchCommand);
  reg.register(rmCommand);
  reg.register(mvCommand);
  reg.register(cpCommand);
  reg.register(clearCommand);
  reg.register(whoamiCommand);
  reg.register(helpCommand);
  reg.register(manCommand);
  reg.register(historyCommand);
  reg.register(aiCommand);
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
    const state = get();
    return state.sessions[state.activeSessionId]!;
  },

  getHistoryItems: () => {
    const session = get().getActiveSession();
    return session.history.getAll();
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
    const session = get().getActiveSession();
    session.history.resetIndex();
  },

  execute: async (line) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;
    const abortController = new AbortController();

    const result = await executeLine(
      line,
      {
        vfs: state.vfs,
        env: session.env,
        registry: state.registry,
        history: session.history.getAll(),
      },
      session.cwd,
      abortController.signal,
    );

    if (result.newCwd !== session.cwd) {
      session.cwd = result.newCwd;
    }

    return result;
  },
}));
