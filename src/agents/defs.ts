import { sgr, RESET, fgHex } from '@/term/ansi';
import type { AgentDef, BannerCtx } from './types';
import { box, compactBanner, gradientArt } from './banners';
import { ANTIGRAVITY_ART, GEMINI_ART, OPENCODE_ART } from './ascii';

/* ── shared persona scaffolding ─────────────────────────────────────────── */

const PROJECT_CONTEXT =
  `The user's terminal shows a workspace at C:\\Users\\user with a small project ` +
  `"demo-app" (React 19 + Vite + Vitest; files: package.json, README.md, src/index.ts ` +
  `with a DOM greeting, src/utils.ts with formatGreeting() and clamp()). ` +
  `A side panel may show simulated tool activity (Read/Search/Bash) before your reply — ` +
  `never contradict it, never claim you cannot access the terminal or files. ` +
  `If asked about "this project", talk about demo-app naturally.`;

const OUTPUT_RULES =
  `Output rules: plain text with light markdown only — **bold**, \`inline code\`, ` +
  `fenced code blocks, short "-" lists, ## headings sparingly. Never emit HTML or ANSI codes. ` +
  `Be concise and direct: a few short paragraphs or a tight list. Expand only when asked. ` +
  `For code questions give working code first, then one or two sentences of explanation.`;

/* ── spinner frame sets ─────────────────────────────────────────────────── */

const PULSE = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];
const BRAILLE = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const ORBIT = ['◐', '◓', '◑', '◒'];

/* ── Claude Code ────────────────────────────────────────────────────────── */

export const claudeAgent: AgentDef = {
  id: 'claude-code',
  command: 'claude',
  label: 'Claude Code',
  sublabel: "Anthropic's agentic CLI",
  icon: '✳',
  accent: '#d97757',
  displayModel: 'claude-opus-4-8',
  realModel: 'gemini:gemini-2.5-flash',
  spinnerVerbs: ['Pondering', 'Vibing', 'Brewing', 'Scheming', 'Honking', 'Noodling',
    'Mulling', 'Percolating', 'Marinating', 'Tinkering', 'Crunching'],
  spinnerFrames: PULSE,
  promptGlyph: '>',
  replyGlyph: '⏺',
  toolGlyph: '⏺',
  ghost: 'Try "explain what demo-app does"',
  toolNames: { read: 'Read', grep: 'Grep', bash: 'Bash', edit: 'Update', web: 'WebSearch' },
  farewell: 'Goodbye! ✻',
  persona:
    `You are Claude Code, Anthropic's official CLI for Claude — an expert software engineer ` +
    `living in the user's terminal on Windows. Voice: calm, competent, a little warm; no fluff. ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const orange = fgHex(this.accent);
    if (ctx.cols < 56) {
      return compactBanner('✻ Claude Code', this.accent,
        ['/help for help', 'cwd: ' + ctx.cwd]);
    }
    const inner = [
      `${orange}✻${RESET} Welcome to ${sgr.bold}Claude Code${RESET}!`,
      '',
      `  ${sgr.dim}/help for help, /status for your current setup${RESET}`,
      '',
      `  ${sgr.dim}cwd: ${ctx.cwd}${RESET}`,
    ];
    return [
      ...box(inner, orange, 50),
      '',
      ` ${sgr.dim}Tips for getting started:${RESET}`,
      ` ${sgr.dim}1. Ask questions, plan a change, or paste an error${RESET}`,
      ` ${sgr.dim}2. Be specific for the best results${RESET}`,
    ];
  },
};

/* ── Google Antigravity ─────────────────────────────────────────────────── */

export const antigravityAgent: AgentDef = {
  id: 'antigravity',
  command: 'antigravity',
  label: 'Antigravity',
  sublabel: "Google's agent-first platform",
  icon: '◉',
  accent: '#4285f4',
  accent2: '#a142f4',
  displayModel: 'gemini-3-pro',
  realModel: 'gemini:gemini-2.5-flash',
  spinnerVerbs: ['Orchestrating', 'Planning', 'Delegating', 'Synthesizing', 'Reasoning', 'Executing'],
  spinnerFrames: ORBIT,
  promptGlyph: '◉ ›',
  replyGlyph: '◉',
  toolGlyph: '◇',
  ghost: 'Describe a task — the agent plans first, then executes',
  planning: true,
  toolNames: { read: 'ReadFile', grep: 'SearchWorkspace', bash: 'RunCommand', edit: 'ApplyEdit', web: 'BrowseWeb' },
  farewell: 'Touchdown. Antigravity disengaged. ◉',
  persona:
    `You are Antigravity, Google's agent-first development platform, running as a terminal agent. ` +
    `You think like a project manager crossed with a senior engineer: you briefly frame the plan, ` +
    `then deliver the result. Voice: confident, structured, forward-looking. When useful, open with ` +
    `a one-line summary of what you did/decided (the terminal already showed your plan checklist). ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const a1 = this.accent;
    const a2 = this.accent2!;
    if (ctx.cols < 62) {
      return compactBanner('◉ ANTIGRAVITY', a1,
        ['agent-first development · Google', 'model: ' + this.displayModel, 'cwd: ' + ctx.cwd]);
    }
    const art = gradientArt(ANTIGRAVITY_ART, a1, a2);
    return [
      ...art,
      '',
      ` ${fgHex(a1)}◉${RESET} ${sgr.bold}Antigravity${RESET} ${sgr.dim}· agent-first development platform · Google${RESET}`,
      ` ${sgr.dim}model: ${this.displayModel} · cwd: ${ctx.cwd}${RESET}`,
      ` ${sgr.dim}Type a task. The agent plans, then executes. /help for commands.${RESET}`,
    ];
  },
};

/* ── Gemini CLI ─────────────────────────────────────────────────────────── */

export const geminiAgent: AgentDef = {
  id: 'gemini-cli',
  command: 'gemini',
  label: 'Gemini CLI',
  sublabel: "Google's open-source AI CLI",
  icon: '✦',
  accent: '#4796e3',
  accent2: '#9168c0',
  displayModel: 'gemini-2.5-pro',
  realModel: 'gemini:gemini-2.5-flash',
  spinnerVerbs: ['Thinking', 'Reasoning', 'Composing', 'Considering', 'Synthesizing'],
  spinnerFrames: BRAILLE,
  promptGlyph: '>',
  replyGlyph: '✦',
  toolGlyph: '✦',
  ghost: 'Ask anything — e.g. "review src/utils.ts"',
  toolNames: { read: 'ReadFile', grep: 'FindText', bash: 'Shell', edit: 'WriteFile', web: 'GoogleSearch' },
  farewell: 'Agent powering down. Goodbye!',
  persona:
    `You are Gemini CLI, Google's open-source AI agent for the command line. ` +
    `Voice: bright, helpful, technically sharp. ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    if (ctx.cols < 48) {
      return compactBanner('✦ Gemini CLI', this.accent, ['model: ' + this.displayModel, 'cwd: ' + ctx.cwd]);
    }
    const art = gradientArt(GEMINI_ART, this.accent, this.accent2!);
    return [
      ...art,
      '',
      `${sgr.dim}Tips for getting started:${RESET}`,
      `${sgr.dim}1. Ask questions, edit files, or run commands.${RESET}`,
      `${sgr.dim}2. Be specific for the best results.${RESET}`,
      `${sgr.dim}3. /help for more information.${RESET}`,
    ];
  },
};

/* ── GitHub Copilot CLI ─────────────────────────────────────────────────── */

export const copilotAgent: AgentDef = {
  id: 'copilot',
  command: 'copilot',
  label: 'GitHub Copilot',
  sublabel: 'Your AI pair programmer',
  icon: '⌐■',
  accent: '#8957e5',
  displayModel: 'gpt-5.2',
  realModel: 'groq:llama-3.3-70b-versatile',
  spinnerVerbs: ['Thinking', 'Pairing', 'Suggesting', 'Reviewing', 'Compiling thoughts'],
  spinnerFrames: BRAILLE,
  promptGlyph: '❯',
  replyGlyph: '●',
  toolGlyph: '●',
  ghost: 'Ask your pair programmer anything',
  toolNames: { read: 'view', grep: 'search', bash: 'run', edit: 'edit', web: 'fetch' },
  farewell: 'Copilot signing off. Happy coding!',
  persona:
    `You are GitHub Copilot CLI, the AI pair programmer by GitHub. Voice: friendly senior ` +
    `dev doing pair programming; practical, encouraging, zero corporate speak. Lead with ` +
    `working code or the exact command. End with a single short "Next:" suggestion when natural. ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const purple = fgHex(this.accent);
    const inner = [
      `${purple}⌐■_■${RESET}  ${sgr.bold}GitHub Copilot CLI${RESET}`,
      '',
      `  ${sgr.dim}model: ${this.displayModel} · /help for commands${RESET}`,
      `  ${sgr.dim}cwd: ${ctx.cwd}${RESET}`,
    ];
    if (ctx.cols < 52) return compactBanner('⌐■_■ GitHub Copilot', this.accent, ['cwd: ' + ctx.cwd]);
    return box(inner, purple, 46);
  },
};

/* ── opencode ───────────────────────────────────────────────────────────── */

export const opencodeAgent: AgentDef = {
  id: 'opencode',
  command: 'opencode',
  label: 'opencode',
  sublabel: 'Open-source terminal agent',
  icon: '▌',
  accent: '#e8a262',
  displayModel: 'opencode zen · auto',
  realModel: 'groq:llama-3.3-70b-versatile',
  spinnerVerbs: ['Working', 'Reading', 'Thinking', 'Building'],
  spinnerFrames: ['▖', '▘', '▝', '▗'],
  promptGlyph: '❯',
  replyGlyph: '▌',
  toolGlyph: '▌',
  ghost: 'plain questions, plain answers',
  toolNames: { read: 'read', grep: 'grep', bash: 'bash', edit: 'edit', web: 'webfetch' },
  farewell: 'opencode out.',
  persona:
    `You are opencode, a minimal open-source terminal coding agent. Voice: terse, precise, ` +
    `engineer-to-engineer; no pleasantries, no filler, never more words than needed. ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const a = fgHex(this.accent);
    if (ctx.cols < 44) return compactBanner('▌opencode', this.accent, ['cwd: ' + ctx.cwd]);
    return [
      ...OPENCODE_ART.map((l) => sgr.bold + l + RESET),
      '',
      ` ${a}▌${RESET} ${sgr.dim}open-source terminal agent · ${this.displayModel}${RESET}`,
      ` ${sgr.dim}  cwd ${ctx.cwd} · /help for commands${RESET}`,
    ];
  },
};

/* ── OpenAI Codex CLI ───────────────────────────────────────────────────── */

export const codexAgent: AgentDef = {
  id: 'codex',
  command: 'codex',
  label: 'Codex CLI',
  sublabel: "OpenAI's coding agent",
  icon: '>_',
  accent: '#74aa9c',
  displayModel: 'gpt-5.2-codex',
  realModel: 'groq:llama-3.3-70b-versatile',
  spinnerVerbs: ['Thinking'],
  spinnerFrames: BRAILLE,
  promptGlyph: '›',
  replyGlyph: '∙',
  toolGlyph: '∙',
  ghost: 'Describe a change; Codex proposes the diff',
  toolNames: { read: 'read', grep: 'rg', bash: 'shell', edit: 'apply_patch', web: 'web.search' },
  farewell: 'codex session ended.',
  footer(ms, chars) {
    return `  ⎿  ~${Math.max(8, Math.round(chars / 4))} tokens · ${(ms / 1000).toFixed(1)}s`;
  },
  persona:
    `You are Codex CLI, OpenAI's terminal coding agent. Voice: quiet professional; minimal ` +
    `words, maximal signal. Prefer diffs and exact commands over prose. ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const teal = fgHex(this.accent);
    const inner = [
      `${teal}>_${RESET} ${sgr.bold}OpenAI Codex${RESET} ${sgr.dim}(v0.48.0)${RESET}`,
      '',
      `  ${sgr.dim}model:   ${this.displayModel}${RESET}`,
      `  ${sgr.dim}cwd:     ${ctx.cwd}${RESET}`,
      `  ${sgr.dim}/help for commands · esc interrupts${RESET}`,
    ];
    if (ctx.cols < 52) return compactBanner('>_ OpenAI Codex', this.accent, ['cwd: ' + ctx.cwd]);
    return box(inner, teal, 46);
  },
};

/* ── Mythos OS ──────────────────────────────────────────────────────────── */

export const mythosAgent: AgentDef = {
  id: 'mythos',
  command: 'mythos',
  label: 'Mythos OS',
  sublabel: 'Cyber-security rig · phase crab',
  icon: '☠',
  accent: '#cc2233',
  displayModel: 'MYTHOS-SEC-7B',
  realModel: 'groq:llama-3.3-70b-versatile',
  spinnerVerbs: ['Scanning', 'Enumerating', 'Decrypting', 'Tracing', 'Sniffing packets', 'Cross-referencing'],
  spinnerFrames: ['▰▱▱', '▰▰▱', '▰▰▰', '▱▰▰', '▱▱▰', '▱▱▱'],
  promptGlyph: 'root@mythos:~#',
  replyGlyph: '▸',
  toolGlyph: '▸',
  ghost: 'state your objective',
  toolNames: { read: 'scan', grep: 'probe', bash: 'exec', edit: 'patch', web: 'recon' },
  farewell: 'Connection severed. The crab remembers.',
  persona:
    `You are Mythos OS, a cyber-security terminal AI with a dark, mysterious edge. Expert in ` +
    `defensive security, pentesting concepts, networking, and cryptography. Voice: terse, ` +
    `technical, occasional hacking metaphors — but always give real, accurate, ethical guidance ` +
    `(no actual malicious payloads; redirect to defense). ` +
    PROJECT_CONTEXT + ' ' + OUTPUT_RULES,
  banner(ctx: BannerCtx): string[] {
    const R = fgHex('#cc2233');
    const D = sgr.dim;
    const crab = [
      '     -- PHASE CRAB --',
      '',
      '     ><(         )><',
      '    / \\   _____   / \\',
      '   |   \\_/     \\_/   |',
      '    \\   |  o o  |   /',
      "     '--|_______|--'",
    ];
    const inner = [
      `${R}${sgr.bold}MYTHOS OS v2.7${RESET} ${D}· secure shell${RESET}`,
      ...crab.map((l) => R + l + RESET),
    ];
    if (ctx.cols < 44) return compactBanner('☠ MYTHOS OS', this.accent, ['AUDIT MODE ACTIVE']);
    return [
      ...box(inner, R, 34),
      `  ${D}model ${this.displayModel} · AUDIT MODE ACTIVE${RESET}`,
      `  ${R}*${RESET} ${D}all activity is simulated · stay ethical${RESET}`,
    ];
  },
};

export const AGENT_DEFS: AgentDef[] = [
  claudeAgent, antigravityAgent, geminiAgent, copilotAgent,
  opencodeAgent, codexAgent, mythosAgent,
];
