import { create } from 'zustand';
import { VFS, Env, History, CommandRegistry, executeLine } from '@/kernel';
import type { ChatMsg } from '@/providers/types';
import { claudeCodeSkin, loadSkin } from '@/themes/manifests';
import { ALL_SKIN_META } from '@/themes/skin-meta';
import { applyTheme, getSkin } from '@/themes/registry';
import type { ThemeSkin } from '@/themes/registry';
import { saveToIndexedDB, loadFromIndexedDB } from '@/lib/persistence';
import type { PersistedData } from '@/lib/persistence';

import { lsCommand, cdCommand, pwdCommand, catCommand, echoCommand, mkdirCommand, touchCommand, rmCommand, mvCommand, cpCommand, clearCommand, whoamiCommand, helpCommand, manCommand, historyCommand, aiCommand, setHelpRegistry, setHistorySource } from '@/kernel';
import { grepCommand } from '@/kernel/commands/grep';
import { headCommand } from '@/kernel/commands/head';
import { tailCommand } from '@/kernel/commands/tail';
import { wcCommand } from '@/kernel/commands/wc';
import { envCommand } from '@/kernel/commands/env';
import { exportCommand } from '@/kernel/commands/export-cmd';
import { dateCommand } from '@/kernel/commands/date';
import { calCommand } from '@/kernel/commands/cal';
import { unameCommand } from '@/kernel/commands/uname';
import { treeCommand } from '@/kernel/commands/tree';
import { whichCommand } from '@/kernel/commands/which';
import { dfCommand } from '@/kernel/commands/df';
import { uptimeCommand } from '@/kernel/commands/uptime';
import { psCommand } from '@/kernel/commands/ps';
import { aptCommand } from '@/kernel/commands/apt';
import { lolcatCommand } from '@/kernel/commands/lolcat-cmd';
import { modelCommand } from '@/kernel/commands/model-cmd';
import { uiCommand } from '@/kernel/commands/ui-cmd';
import { dayCommand, nightCommand } from '@/kernel/commands/day-cmd';
import { fxCommand } from '@/kernel/commands/fx-cmd';
import { settingsCommand, shareThemeCommand } from '@/kernel/commands/settings-cmd';
import { soundCommand } from '@/kernel/commands/sound-cmd';
import { lazyCommands } from '@/kernel/lazy-commands';

function createRegistry(): CommandRegistry {
  const reg = new CommandRegistry();
  const commands = [
    lsCommand, cdCommand, pwdCommand, catCommand, echoCommand,
    mkdirCommand, touchCommand, rmCommand, mvCommand, cpCommand,
    clearCommand, whoamiCommand, helpCommand, manCommand, historyCommand,
    aiCommand, grepCommand, headCommand, tailCommand, wcCommand,
    envCommand, exportCommand, dateCommand, calCommand, unameCommand,
    treeCommand, whichCommand, dfCommand, uptimeCommand, psCommand,
    aptCommand, lolcatCommand,
    ...lazyCommands,
    modelCommand, uiCommand, dayCommand, nightCommand, fxCommand,
    settingsCommand, shareThemeCommand, soundCommand,
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

export type SessionType = 'terminal' | 'chat' | 'mythos';

interface SessionMeta {
  id: string;
  label: string;
}

interface Session {
  type: SessionType;
  tabSkin: string | null; // null = use global skin
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
  sessionOrder: SessionMeta[];
  activeSessionId: string;
  _hydrated: boolean;
  skin: ThemeSkin;
  mode: 'dark' | 'light';
  fxEnabled: boolean;
  soundFx: boolean;
  aiPanelVisible: boolean;

  setHydrated: (v: boolean) => void;
  setAiPanelVisible: (v: boolean) => void;
  execute: (line: string, signal?: AbortSignal, onOutput?: (chunk: string) => void) => Promise<{ output: string; newCwd: string }>;
  getActiveSession: () => Session;
  getHistoryItems: () => string[];
  addHistory: (line: string) => void;
  navigateHistory: (dir: 'back' | 'forward') => string | undefined;
  resetHistoryIndex: () => void;
  getChatState: () => ChatState;
  setChatMessages: (messages: ChatMsg[]) => void;
  setSkin: (id: string) => Promise<void>;
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
  setFxEnabled: (v: boolean) => void;
  setSoundFx: (v: boolean) => void;
  // Model presets — maps friendly names to provider:model strings
  MODEL_PRESETS: Record<string, string>;
  // Tab management
  createSession: (type?: SessionType, skinId?: string, modelPreset?: string) => string;
  closeSession: (id: string) => void;
  renameSession: (id: string, label: string) => void;
  switchSession: (id: string) => void;
  reorderSessions: (fromIndex: number, toIndex: number) => void;
  // Persistence
  _saveState: () => Promise<void>;
  _loadState: () => Promise<Partial<PersistedData> | false>;
}

const DEFAULT_SESSION_ID = crypto.randomUUID?.() ?? 'sess_1';

function createDefaultSession(_id: string, type: SessionType = 'terminal'): Session {
  return {
    type,
    tabSkin: type === 'mythos' ? 'mythos' : null,
    cwd: type === 'mythos' ? '/root' : '/home/user',
    env: new Env(),
    history: new History(),
    chat: {
      chatMessages: [],
      model: type === 'mythos' ? 'groq:llama-3.3-70b-versatile' : 'gemini-2.0-flash',
      persona: type === 'mythos'
        ? 'You are Mythos OS, a cyber-security AI terminal. Your responses should be concise, technical, and security-focused. Use hacking metaphors and cyber terminology. Keep replies short and terminal-friendly. You are an expert in penetration testing, network security, cryptography, and system exploitation. Use a dark, mysterious tone with occasional ASCII art phase crabs.'
        : 'You are Mirage, a warm, witty retro-terminal AI companion. Keep replies terminal-friendly. Be concise.',
      byokKey: '',
    },
  };
}

const vfs = new VFS();
const registry = createRegistry();

const defaultId = DEFAULT_SESSION_ID;
const sessions: Record<string, Session> = {
  [defaultId]: createDefaultSession(defaultId),
};
const sessionOrder: SessionMeta[] = [{ id: defaultId, label: 'Terminal 1' }];

setHistorySource(sessions[defaultId]!.history.getAll());

function initMode(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('mirage-mode');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initSkin(): ThemeSkin {
  // Only claudeCode is statically imported — all other skins are lazy-loaded on demand.
  // The persisted skin is restored during boot (see page.tsx useEffect).
  return claudeCodeSkin;
}

const SKIN_PERSONAS: Record<string, string> = {

  'claude-code': `You are Claude Code, Anthropic's official agentic CLI for Claude — an expert software engineer living in the terminal.

Format rules (follow exactly):
- Use ANSI escapes inline: \x1b[1m bold\x1b[0m, \x1b[2m dim\x1b[0m, \x1b[32m green=ok\x1b[0m, \x1b[31m red=err\x1b[0m, \x1b[33m yellow=warn\x1b[0m, \x1b[36m cyan=info\x1b[0m, \x1b[38;2;229;72;77m Claude-red\x1b[0m
- Before answering, show 1–3 simulated tool lines: \x1b[2m⚙  Reading src/App.tsx…\x1b[0m
- Shell commands: prefix with \x1b[2m$\x1b[0m  (e.g. \x1b[2m$\x1b[0m npm install)
- No markdown headers (##). Use \x1b[1mbold\x1b[0m for headings.
- Concise, numbered steps when listing. No wall-of-text paragraphs.
- Deep expertise: TypeScript, React, Next.js, Node, Python, Rust, databases, CI/CD, security.
- End with \x1b[2m✓ done\x1b[0m or a next-step hint.`,

  'opencode': `You are OpenCode, an open-source AI terminal assistant for developers.
Format rules:
- Plain terminal output — no markdown headers, no bullet walls.
- Code blocks prefixed with \x1b[36m$\x1b[0m for shell or language tag for snippets.
- Dim (\x1b[2m) for file paths, metadata, and secondary info.
- Bold (\x1b[1m) for key terms and section titles.
- Concise and direct. One short answer, then offer to go deeper.`,

  'copilot': `You are GitHub Copilot, AI pair programmer by GitHub & OpenAI, running in a terminal.
Format rules:
- Lead with working code. Explain after, briefly.
- Use \x1b[38;2;137;87;229m purple\x1b[0m (via bold) for emphasis, \x1b[32m green\x1b[0m for success.
- Show GitHub-flavored output: PR diffs, commit messages, CI results.
- Suggest completions in-line: "You might also want: \x1b[2m...\x1b[0m"
- No markdown headers. Use \x1b[1mbold\x1b[0m titles only.
- End with a \x1b[38;2;137;87;229m◆\x1b[0m suggestion for the next logical step.`,

  'cursor': `You are Cursor, the AI-first code editor assistant, running in terminal mode.
Format rules:
- Think in diffs: show what changes, not just what to do.
- Lead with the edit/command, then the rationale in one sentence.
- Use \x1b[38;2;243;133;24m amber\x1b[0m highlights (\x1b[1m) for changed symbols.
- Show file paths as \x1b[2msrc/path/to/file.ts\x1b[0m (dim).
- No markdown. Direct, action-oriented. Surgically precise.`,

  'windsurf': `You are Windsurf (by Codeium), an agentic IDE assistant that surfs through code.
Format rules:
- Use \x1b[38;2;0;212;170m teal\x1b[0m (\x1b[1m) for key points and actions.
- Show "flow" thinking: describe what you'd look at, then what you'd change.
- Multi-file awareness: reference other files by dim path \x1b[2mpath/file\x1b[0m.
- Smooth, confident tone. Never say "I can't" — find the wave and ride it.
- End with \x1b[38;2;0;212;170m🌊 flowing\x1b[0m to confirm completion.`,

  'openclaw': `You are OpenClaw, a raw power-user terminal AI. No hand-holding.
Format rules:
- Ultra-terse. One-liners where possible. Commands, not explanations.
- \x1b[38;2;255;107;53m orange\x1b[0m (\x1b[1m) for important output.
- Show commands prefixed with \x1b[38;2;255;107;53m❯\x1b[0m
- If something is wrong, say exactly what and how to fix it. Nothing else.
- Treat the user as an expert. No "you should probably" hedging.`,

  'mythos': `You are Mythos OS, a cyber-security AI terminal. Concise, technical, security-focused. Use hacking metaphors and cyber terminology. Expert in penetration testing, network security, cryptography, and exploitation. Dark and mysterious tone. Occasional ASCII phase crabs. Responses must be terminal-native — no markdown headers, use \x1b[38;2;204;34;51m red\x1b[0m for critical findings, \x1b[38;2;51;170;68m green\x1b[0m for clean results.`,

  'hacker': `You are a movie-hacker terminal AI. You speak in the terse, dramatic style of 1990s–2000s hacking culture.
Format rules:
- Use \x1b[32m bright green\x1b[0m for all key output.
- Prefix shell commands with \x1b[32m#\x1b[0m (root shell).
- Say things like "I'm in.", "Tracing route…", "Firewall bypassed." for flavor.
- Every answer feels like you're racing the clock to break in.
- Keep it short. No essays. Hackers don't have time.
- End with \x1b[2mConnection maintained.\x1b[0m`,

  'matrix': `You are the Oracle — a terminal AI from inside the Matrix. Reality is code. Everything is a pattern.
Format rules:
- Use \x1b[38;2;0;255;65m Matrix green\x1b[0m for key revelations.
- Speak in cryptic-but-accurate metaphors. "The bug in your code is not a bug — it is a choice the system made."
- Show code as digital rain: \x1b[2m1 0 1 0 \x1b[0m prefixes for binary/hex output.
- Offer the red pill (the real answer) or the blue pill (the easy shortcut).
- Concise, philosophical, precise. You already know what they'll ask.`,

  'dracula': `You are Dracula, a dark and theatrical terminal AI. You have lived through centuries of code.
Format rules:
- Use \x1b[38;2;189;147;249m purple\x1b[0m for key terms, \x1b[38;2;255;121;198m pink\x1b[0m for warnings.
- Dramatic but accurate. "Your segfault is... *delicious*. And fixable."
- Reference the Dracula theme colors: purple, pink, green, cyan.
- Never use markdown headers. Use \x1b[1mbold\x1b[0m for theatrical emphasis.
- End responses with a gothic flourish: \x1b[38;2;189;147;249m✦ the night is yours\x1b[0m`,

  'synthwave': `You are SYNTH, a neon-soaked 80s AI from a retrofuture where everything runs on vibes and MIDI.
Format rules:
- Use \x1b[38;2;255;0;255m magenta\x1b[0m and \x1b[38;2;0;255;255m cyan\x1b[0m for all key output.
- Everything is a music/art metaphor. "Your function needs a better hook."
- Show ASCII art when you can. Keep it retro — stars, grids, sunsets.
- Speak like a synth pad sounds: smooth, atmospheric, full of color.
- End with \x1b[38;2;0;255;255m· neon ·\x1b[0m`,

  'amber-crt': `You are AMBER, a wise 1980s computer running on a phosphor CRT monitor. You've been running since 1983.
Format rules:
- Use \x1b[38;2;255;176;0m amber\x1b[0m for all output.
- Speak in simple, warm, BASIC-era English. "10 PRINT 'Hello'; 20 GOTO 10"
- Show BASIC-style line numbers for steps: \x1b[38;2;255;176;0m10\x1b[0m DO THIS  \x1b[38;2;255;176;0m20\x1b[0m THEN THIS
- Reference the era: no internet, 64KB RAM, tape drives.
- Helpful and patient. You have seen everything since Pong.
- End with \x1b[2mREADY.\x1b[0m`,

  'classic-green': `You are a VT100 phosphor terminal AI from 1978. You speak in the terse style of early Unix systems.
Format rules:
- Use \x1b[32m green\x1b[0m for all output.
- Extremely terse. Unix manpage style. No pleasantries.
- Show file paths, commands, and syscalls accurately.
- Reference classic Unix tools: grep, awk, sed, vi, make, cc.
- No color except green. No emoji. Pure ASCII only.
- End with \x1b[2m%\x1b[0m (the C-shell prompt).`,

  'dos': `You are MS-DOS 6.22, running on an IBM PC Compatible with 640KB RAM and a 40MB hard drive. You respond exactly as MS-DOS would.
Format rules:
- All output in \x1b[1;37m bright white\x1b[0m on the blue background.
- Show DOS-style output: directory listings as \x1b[37m DIR \x1b[0m format, errors as \x1b[1;37mBad command or file name\x1b[0m.
- Prefix every command echo with \x1b[1;37mC:\\>\x1b[0m
- For questions about code: respond as if using \x1b[37mEDIT.COM\x1b[0m or \x1b[37mQBASIC\x1b[0m.
- Use DOS terminology: AUTOEXEC.BAT, CONFIG.SYS, IRQ conflicts, conventional memory.
- For modern concepts, translate: "Docker is like HIMEM.SYS but for the cloud."
- End with \x1b[1;37mC:\\>\x1b[0m_`,

  'high-contrast': `You are a high-contrast accessibility-first terminal AI. Maximum clarity, zero ambiguity.
Format rules:
- Plain text only. No color escapes (they may not render correctly for all users).
- Structure with plain ASCII: === SECTION ===, --- subsection ---, * bullet points.
- Every answer has: WHAT (one sentence), HOW (numbered steps), RESULT (what to expect).
- No jargon without definition. No assumptions about prior knowledge.
- Short sentences. Active voice. Concrete examples.
- End with: [DONE] or [ACTION NEEDED: ...]`,
};

export const useMirageStore = create<MirageState>((set, get) => ({
  version: '0.1.2',
  vfs,
  registry,
  sessions,
  sessionOrder,
  activeSessionId: defaultId,
  _hydrated: false,
  skin: initSkin(),
  mode: initMode(),
  fxEnabled: true,
  soundFx: false,
  aiPanelVisible: false,

  setHydrated: (v) => set({ _hydrated: v }),
  setAiPanelVisible: (v) => set({ aiPanelVisible: v }),

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

    // Fallthrough: unknown commands sent to AI (streamed token-by-token)
    const onFallthrough = async (cmd: string, args: string[]): Promise<string | false | undefined> => {
      const text = [cmd, ...args].join(' ');
      if (text.length > 200) return false;

      // Fire AI panel user message event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mirage:ai-message', { detail: { message: text, role: 'user' } }));
        window.dispatchEvent(new CustomEvent('mirage:ai-message', { detail: { message: '', role: 'assistant_start' } }));
        get().setAiPanelVisible(true);
      }

      try {
        // Show generating indicator in terminal
        onOutput?.('\x1b[2m  generating…\x1b[0m');

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

        if (!res.ok) {
          let errMsg = `HTTP ${res.status}`;
          try { const j = await res.json(); errMsg = j.message ?? errMsg; } catch { /* ignore */ }
          onOutput?.('\r\x1b[K\x1b[31m✗ ' + errMsg + '\x1b[0m\n');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mirage:ai-message', { detail: { message: `Error: ${errMsg}`, role: 'assistant_done' } }));
          }
          return '';
        }

        const reader = res.body?.getReader();
        if (!reader) return false;

        const decoder = new TextDecoder();
        let buffer = '';
        let resultText = '';
        let firstToken = true;
        let switchedTo = '';
        let providerName = '';

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
              if (delta.type === 'delta') {
                if (firstToken) {
                  onOutput?.('\r\x1b[K'); // clear spinner
                  firstToken = false;
                }
                resultText += delta.text;
                onOutput?.(delta.text);
                // Mirror to AI panel
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('mirage:ai-message', { detail: { message: delta.text, role: 'assistant_delta' } }));
                }
              } else if (delta.type === 'meta') {
                if (delta.key === 'switchedTo') switchedTo = delta.value as string;
                if (delta.key === 'provider')   providerName = delta.value as string;
              } else if (delta.type === 'error') {
                onOutput?.('\r\x1b[K\x1b[31m✗ ' + (delta.message ?? 'Error') + '\x1b[0m\n');
                return '';
              } else if (delta.type === 'done') {
                break;
              }
            } catch { /* skip malformed */ }
          }
        }

        // Signal AI panel that streaming is done
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mirage:ai-message', {
            detail: { message: switchedTo || providerName, role: 'assistant_done' }
          }));
        }

        if (resultText) {
          onOutput?.('\n');
          if (switchedTo) {
            onOutput?.('\x1b[2m  via ' + switchedTo + '\x1b[0m\n');
          }
        } else if (firstToken) {
          // No tokens received — clear the indicator
          onOutput?.('\r\x1b[K');
        }

        // Store conversation
        session.chat.chatMessages.push({ role: 'user', content: text });
        session.chat.chatMessages.push({ role: 'assistant', content: resultText });

        // Return empty — output was already streamed via onOutput
        return '';
      } catch {
        onOutput?.('\r\x1b[K');
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
      // Sync store-level settings from state mutations
      if (result.state.soundFx !== undefined) get().setSoundFx(result.state.soundFx);
      if (result.state.fxEnabled !== undefined) get().setFxEnabled(result.state.fxEnabled);
      if (result.state.skin) get().setSkin(result.state.skin);
      if (result.state.mode) get().setMode(result.state.mode);
    }

    // Handle theme commands post-execution
    const trimmed = line.trim();
    if (trimmed === 'day') get().setMode('light');
    else if (trimmed === 'night') get().setMode('dark');
    else if (trimmed.startsWith('ui ')) {
      const skinId = trimmed.slice(3).trim();
      if (skinId && skinId !== 'list') get().setSkin(skinId);
    }
    else if (trimmed === 'fx on') get().setFxEnabled(true);
    else if (trimmed === 'fx off') get().setFxEnabled(false);
    else if (trimmed === '__soundfx_on__') get().setSoundFx(true);
    else if (trimmed === '__soundfx_off__') get().setSoundFx(false);

    // Auto-save
    get()._saveState().catch(() => {});

    return { output: result.output, newCwd: result.newCwd };
  },
  getChatState: () => get().sessions[get().activeSessionId]!.chat,
  setChatMessages: (chatMessages) => {
    const state = get();
    const session = state.sessions[state.activeSessionId]!;
    session.chat.chatMessages = chatMessages;
  },
  setSkin: async (id) => {
    let skin = getSkin(id);
    if (!skin) {
      try {
        skin = await loadSkin(id);
      } catch {
        // Skin not found — silently ignore
        return;
      }
    }
    set({ skin });
    const state = get();
    applyTheme(state.skin, state.mode);
    state._saveState().catch(() => {});
  },
  setMode: (mode) => {
    set({ mode });
    const state = get();
    applyTheme(state.skin, mode);
    state._saveState().catch(() => {});
  },
  toggleMode: () => {
    const state = get();
    const newMode = state.mode === 'dark' ? 'light' : 'dark';
    state.setMode(newMode);
  },
  setFxEnabled: (v) => set({ fxEnabled: v }),
  setSoundFx: (v) => set({ soundFx: v }),

  // Persistence
  _saveState: async () => {
    const state = get();
    const data: PersistedData = {
      vfs: state.vfs.toJSON(),
      sessions: state.sessionOrder.map((meta) => {
        const s = state.sessions[meta.id]!;
        return {
          id: meta.id,
          label: meta.label,
          type: s.type,
          tabSkin: s.tabSkin,
          cwd: s.cwd,
          history: s.history.getAll(),
          chatMessages: s.chat.chatMessages,
          chatModel: s.chat.model,
          chatPersona: s.chat.persona,
          byokKey: s.chat.byokKey,
        };
      }),
      settings: { skin: state.skin.id, mode: state.mode },
    };
    await saveToIndexedDB(data);
  },
  _loadState: async () => {
    const data = await loadFromIndexedDB();
    if (!data.vfs && !data.sessions) return false;
    // Reconstruct sessions with proper type
    const state = get();
    if (data.sessions) {
      for (const s of data.sessions) {
        const session = state.sessions[s.id];
        if (session) {
          if (s.type === 'mythos') session.type = 'mythos';
          else session.type = s.type === 'chat' ? 'chat' : 'terminal';
          if ((s as any).tabSkin) {
            session.tabSkin = (s as any).tabSkin;
            // Pre-load the tab skin for correct rendering after refresh
            const tabSkin = (s as any).tabSkin as string;
            if (!getSkin(tabSkin)) {
              loadSkin(tabSkin).catch(() => {});
            }
          }
        }
      }
    }
    return data;
  },
  /** Model preset aliases — maps friendly names to provider:model strings */
  MODEL_PRESETS: {
    'opus-4.7': 'gemini:gemini-2.0-flash',
    'claude-code-opus-4.8': 'groq:llama-3.3-70b-versatile',
    'sonnet-4.7': 'openrouter:auto:free',
    'haiku-4.7': 'gemini:gemini-2.0-flash',
    'kiros-4.8': 'openrouter:auto:free',
  } as Record<string, string>,

  createSession: (type = 'terminal', skinId?: string, modelPreset?: string) => {
    const id = crypto.randomUUID();
    const count = get().sessionOrder.length + 1;
    let label: string;
    if (type === 'mythos') {
      label = `Mythos OS ${count}`;
    } else if (type === 'chat') {
      const skinMeta = skinId ? ALL_SKIN_META.find((m) => m.id === skinId) : undefined;
      label = skinMeta ? `AI Chat (${skinMeta.label})` : `AI Chat ${count}`;
    } else {
      label = `Terminal ${count}`;
    }
    const session = createDefaultSession(id, type);
    if (skinId) {
      session.tabSkin = skinId;
      // Pre-load the skin so it's available for rendering immediately
      if (!getSkin(skinId)) {
        loadSkin(skinId).catch(() => {});
      }
      // Apply skin-specific AI persona for chat/agentic tabs
      const skinPersona = SKIN_PERSONAS[skinId];
      if (skinPersona && type === 'chat') {
        session.chat.persona = skinPersona;
      }
    }
    // Apply model preset if provided
    if (modelPreset) {
      const presets = get().MODEL_PRESETS;
      if (presets[modelPreset]) {
        session.chat.model = presets[modelPreset]!;
      }
    }
    set((s) => ({
      sessions: { ...s.sessions, [id]: session },
      sessionOrder: [...s.sessionOrder, { id, label }],
      activeSessionId: id,
    }));
    get()._saveState().catch(() => {});
    return id;
  },
  closeSession: (id) => {
    const state = get();
    if (state.sessionOrder.length <= 1) return;
    const newOrder = state.sessionOrder.filter((m) => m.id !== id);
    const newSessions = { ...state.sessions };
    delete newSessions[id];
    const newActive = state.activeSessionId === id
      ? newOrder[newOrder.length - 1]!.id
      : state.activeSessionId;
    set({ sessions: newSessions, sessionOrder: newOrder, activeSessionId: newActive });
    get()._saveState().catch(() => {});
  },
  renameSession: (id, label) => {
    set((s) => ({
      sessionOrder: s.sessionOrder.map((m) => (m.id === id ? { ...m, label } : m)),
    }));
    get()._saveState().catch(() => {});
  },
  switchSession: (id) => {
    const state = get();
    if (!state.sessions[id]) return;
    set({ activeSessionId: id });
    // Update history source for the new session
    const session = state.sessions[id]!;
    setHistorySource(session.history.getAll());
  },
  reorderSessions: (fromIndex, toIndex) => {
    const state = get();
    const order = [...state.sessionOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved!);
    set({ sessionOrder: order });
    state._saveState().catch(() => {});
  },
}));
