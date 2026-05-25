import { create } from 'zustand';
import { VFS, Env, History, CommandRegistry, executeLine } from '@/kernel';
import type { ChatMsg } from '@/providers/types';
import { registerAllSkins, claudeCodeSkin } from '@/themes/manifests';
import { applyTheme, getSkin } from '@/themes/registry';
import type { ThemeSkin } from '@/themes/registry';

registerAllSkins();
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
import { aptCommand } from '@/kernel/commands/apt';
import { figletCommand } from '@/kernel/commands/figlet-cmd';
import { cowsayCommand } from '@/kernel/commands/cowsay-cmd';
import { lolcatCommand } from '@/kernel/commands/lolcat-cmd';
import { fortuneCommand } from '@/kernel/commands/fortune-cmd';
import { cmatrixCommand } from '@/kernel/commands/cmatrix-cmd';
import { hollywoodCommand } from '@/kernel/commands/hollywood-cmd';
import { slCommand } from '@/kernel/commands/sl-cmd';
import { nyancatCommand } from '@/kernel/commands/nyancat-cmd';
import { modelCommand } from '@/kernel/commands/model-cmd';
import { uiCommand } from '@/kernel/commands/ui-cmd';
import { dayCommand, nightCommand } from '@/kernel/commands/day-cmd';

function createRegistry(): CommandRegistry {
  const reg = new CommandRegistry();
  const commands = [
    lsCommand, cdCommand, pwdCommand, catCommand, echoCommand,
    mkdirCommand, touchCommand, rmCommand, mvCommand, cpCommand,
    clearCommand, whoamiCommand, helpCommand, manCommand, historyCommand,
    aiCommand, grepCommand, headCommand, tailCommand, wcCommand,
    envCommand, exportCmdCommand, dateCommand, calCommand, unameCommand,
    treeCommand, whichCommand, dfCommand, uptimeCommand, psCommand,
    neofetchCommand, aptCommand, figletCommand, cowsayCommand, lolcatCommand,
    fortuneCommand, cmatrixCommand, hollywoodCommand, slCommand, nyancatCommand,
    modelCommand, uiCommand, dayCommand, nightCommand,
    { ...aiCommand, name: 'ask' }, // alias for ai
  ];
  for (const cmd of commands) reg.register(cmd);
  setHelpRegistry(reg);
  return reg;
}

interface ChatState {
  chatMessages: ChatMsg[];
  model: string;
  persona: string;
  byokKey: string;
}

interface Session {
  cwd: string;
  env: Env;
  history: History;
  chat: ChatState;
}

interface MirageState {
  version: string;
  vfs: VFS;
  registry: CommandRegistry;
  sessions: Record<string, Session>;
  activeSessionId: string;
  _hydrated: boolean;
  skin: ThemeSkin;
  mode: 'dark' | 'light';

  setHydrated: (v: boolean) => void;
  execute: (line: string, signal?: AbortSignal, onOutput?: (chunk: string) => void) => Promise<{ output: string; newCwd: string }>;
  getActiveSession: () => Session;
  getHistoryItems: () => string[];
  addHistory: (line: string) => void;
  navigateHistory: (dir: 'back' | 'forward') => string | undefined;
  resetHistoryIndex: () => void;
  getChatState: () => ChatState;
  setChatMessages: (messages: ChatMsg[]) => void;
  setSkin: (id: string) => void;
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
}

const DEFAULT_SESSION_ID = 'default';

const vfs = new VFS();
const registry = createRegistry();

const sessions: Record<string, Session> = {
  [DEFAULT_SESSION_ID]: {
    cwd: '/home/user',
    env: new Env(),
    history: new History(),
    chat: {
      chatMessages: [],
      model: 'gemini-2.0-flash',
      persona: 'You are Mirage, a warm, witty retro-terminal AI companion. Keep replies terminal-friendly. Be concise.',
      byokKey: '',
    },
  },
};

setHistorySource(sessions[DEFAULT_SESSION_ID]!.history.getAll());

function initMode(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('mirage-mode');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initSkin(): ThemeSkin {
  if (typeof window === 'undefined') return claudeCodeSkin;
  const stored = localStorage.getItem('mirage-skin');
  if (stored) return getSkin(stored) ?? claudeCodeSkin;
  return claudeCodeSkin;
}

export const useMirageStore = create<MirageState>((set, get) => ({
  version: '0.1.0',
  vfs,
  registry,
  sessions,
  activeSessionId: DEFAULT_SESSION_ID,
  _hydrated: false,
  skin: initSkin(),
  mode: initMode(),

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

  execute: async (line, signal, onOutput) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;

    // Fallthrough: unknown commands sent to AI
    const onFallthrough = async (cmd: string, args: string[]): Promise<string | false | undefined> => {
      // Don't fallthrough for built-in commands that happen to not be found
      // Only fallthrough when it looks like natural language
      const text = [cmd, ...args].join(' ');
      if (text.length > 200) return false;

      try {
        const messages = [...session.chat.chatMessages, { role: 'user' as const, content: text }];
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            model: session.chat.model,
            persona: session.chat.persona,
            key: session.chat.byokKey || undefined,
          }),
          signal: signal ?? new AbortController().signal,
        });
        if (!res.ok) return false;

        const reader = res.body?.getReader();
        if (!reader) return false;

        const decoder = new TextDecoder();
        let buffer = '';
        let resultText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (!data) continue;
            try {
              const delta = JSON.parse(data);
              if (delta.type === 'delta') resultText += delta.text;
              if (delta.type === 'done') break;
            } catch { /* skip */ }
          }
        }

        // Store the AI response in chat
        session.chat.chatMessages.push({ role: 'user', content: text });
        session.chat.chatMessages.push({ role: 'assistant', content: resultText });

        return resultText + '\n';
      } catch {
        return false;
      }
    };

    const result = await executeLine(
      line,
      {
        vfs: state.vfs,
        env: session.env,
        registry: state.registry,
        history: session.history.getAll(),
        chatModel: session.chat.model,
        chatPersona: session.chat.persona,
        byokKey: session.chat.byokKey || undefined,
        _state: session.chat,
      },
      session.cwd,
      signal ?? new AbortController().signal,
      onOutput,
      onFallthrough,
    );

    if (result.newCwd !== session.cwd) {
      session.cwd = result.newCwd;
    }

    // Update chat messages from mutable state
    if (result.state) {
      session.chat.chatMessages = result.state.chatMessages;
      if (result.state.chatModel) session.chat.model = result.state.chatModel;
      if (result.state.chatPersona) session.chat.persona = result.state.chatPersona;
    }

    // Handle theme commands post-execution
    const trimmed = line.trim();
    if (trimmed === 'day') get().setMode('light');
    else if (trimmed === 'night') get().setMode('dark');
    else if (trimmed.startsWith('ui ')) {
      const skinId = trimmed.slice(3).trim();
      if (skinId && skinId !== 'list') get().setSkin(skinId);
    }

    return { output: result.output, newCwd: result.newCwd };
  },
  getChatState: () => get().sessions[get().activeSessionId]!.chat,
  setChatMessages: (chatMessages) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;
    session.chat.chatMessages = chatMessages;
  },
  setSkin: (id) => {
    const skin = getSkin(id);
    if (!skin) return;
    set({ skin });
    const state = get();
    applyTheme(skin, state.mode);
  },
  setMode: (mode) => {
    set({ mode });
    const state = get();
    applyTheme(state.skin, mode);
  },
  toggleMode: () => {
    const state = get();
    const newMode = state.mode === 'dark' ? 'light' : 'dark';
    state.setMode(newMode);
  },
}));
