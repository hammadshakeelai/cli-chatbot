# AGENTS.md — Mirage Terminal project memory

> Read this before changing code. `SPEC.md` is the full v2 specification; this file is the
> working contract. (v1 — the Linux-style "Mirage" with skin-personas and a popup AI panel —
> was replaced wholesale in June 2026.)

## What this is

A simulated **Windows Terminal + PowerShell** in the browser. Inside the shell, users launch
simulated **agentic AI CLIs** (`claude`, `antigravity`, `gemini`, `copilot`, `opencode`,
`codex`, `mythos`). Shell, filesystem, and tool calls are theater; AI replies are real
(Gemini → Groq → OpenRouter via `/api/chat`, keys server-side, BYOK optional).

## Architecture invariants

1. **Engine lives outside React.** `src/term/manager.ts` owns `Session` objects (one per tab:
   xterm instance + REPL stack). React (`src/ui/*`) only renders chrome and tells the manager
   what changed. **Never** recreate a terminal on theme/tab/setting changes — update
   `term.options` in place (`Session.applySettings`).
2. **REPL stack.** Every session boots a `ShellRepl` (PowerShell). Agents are `Repl`s pushed on
   top (`createAgentRepl` in `src/agents/runner.ts`); `/exit` pops back to the shell. The
   `Repl` interface lives in `src/term/types.ts`.
3. **One shared `WinFS`** across tabs (like a real machine); per-tab cwd/history/chat context.
   Filesystem is in-memory, case-insensitive, seeded in `src/shell/winfs.ts` — agents'
   simulated tool calls reference those seeded paths (`THEATER_FILES`), keep them in sync.
4. **The printer owns styling.** Personas instruct models to emit plain markdown; the streaming
   markdown→ANSI renderer (`src/term/streamPrinter.ts`) does bold/code/headings/bullets/fences/
   word-wrap. Don't let models emit ANSI.
5. **Adding an agent** = one `AgentDef` in `src/agents/defs.ts` (+ `AGENT_DEFS` array). It
   automatically becomes a shell command, a dropdown profile, a palette entry, and an
   `agents`-list row. Use the `box()` / `gradientArt()` helpers from `banners.ts` for banners —
   never hand-pad box borders. Big ASCII art is generated into `src/agents/ascii.ts` by
   `scripts/gen-ascii.cjs` (figlet) — regenerate, don't hand-edit.
6. **Adding a shell command** = a `ShellCommand` in `src/shell/commands/*` registered in
   `ShellRepl.registerAll`. Long-running/animated commands: mark `interactive: true`, write via
   `ctx.io`, honor `ctx.signal` + `ctx.sleep`.
7. **Keys never reach the client.** `/api/chat` reads env keys; BYOK is forwarded per-request,
   stored only in localStorage, never logged.
8. **Authenticity rules:** PowerShell errors use the 5.1 red block format. Window/UI mimics
   Windows Terminal. Agents inherit the terminal's color scheme (only Mythos has its own scheme,
   user-selectable). Keep agent output calm and minimal — like the real tools.

## Tech

Next.js 15 (App Router) · React 19 · TS strict (`noUncheckedIndexedAccess`, no unused) ·
Tailwind v4 (used lightly; chrome is semantic CSS in `globals.css`) · Zustand (UI state only) ·
@xterm/xterm v6 + fit/web-links/webgl.

## Quality gates (all must pass)

```bash
npm run typecheck && npm run test && npm run lint && npm run build
npx playwright test        # e2e — uses the window.__mirage dev hook
```

Visual checks: `node scripts/shots.cjs` (needs `npm run dev` running) writes screenshots
to `shots/`.

## Known footguns

- `.env.local` ships with dummy keys → agents show the key-guidance error until a real free
  key is added (or pasted in Settings → BYOK).
- Browser-reserved shortcuts (Ctrl+T/W, Ctrl+Tab) can't be intercepted — tab shortcuts are
  Alt+T / Alt+W / Alt+1…8.
- `public/sw.js` is intentionally a self-destructing service worker (v1's cache served stale
  builds). Don't reintroduce precaching without cache-busting.
- xterm pending-wrap: the line editor resolves exact-multiple-of-cols rendering with a
  `' \b'` trick (`lineEditor.ts`) — keep it when touching redraw logic.
