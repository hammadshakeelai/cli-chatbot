# 03 — Architecture

## High-level
```
┌──────────────────────────────────────────────────────────────┐
│ Browser (Next.js client / React)                              │
│                                                                │
│  ┌────────── UI Chrome (React, skinnable) ─────────────────┐  │
│  │ TabBar │ Header/Banner │ StatusLine │ GUI buttons │ Cmd⌘K │  │
│  └────────────────────────┬──────────────────────────────┘   │
│                           │ renders per active skin (CSS vars) │
│  ┌──────────── Terminal viewport (xterm.js) ───────────────┐  │
│  │  scrollback buffer · ANSI · input · addons(fit/links/…)  │  │
│  └────────────────────────┬──────────────────────────────┘   │
│                           │ I/O bus                            │
│  ┌──────────────── Shell Kernel (TS, pure) ────────────────┐  │
│  │  Parser → Pipeline → Command/App Registry → VFS          │  │
│  │  Env · History · apt(simulated) · AI-bridge command      │  │
│  └────────────────────────┬──────────────────────────────┘   │
│                           │                                    │
│  Zustand store (sessions, settings, theme, providers) ◄──────┐│
│  Persistence: localStorage (settings) · IndexedDB (VFS/hist) ││
└───────────────────────────┬───────────────────────────────────┘
                            │ fetch (SSE stream), BYOK header
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Server (Next.js Route Handlers / serverless)                  │
│  /api/chat  → Provider Router → [Gemini|Groq|OpenRouter|...]   │
│  /api/health, /api/models                                      │
│  Rate limiter (KV/Upstash, per-IP) · keys from env            │
└──────────────────────────────────────────────────────────────┘
```

## Layers
1. **UI Chrome (React).** All visible structure except the scrollback buffer. Fully skinnable; reads CSS vars + active skin manifest. Owns tabs, banner, status, GUI controls, command palette, settings sheet, on-screen mobile key bar.
2. **Terminal viewport (xterm.js).** One instance per tab, kept alive across switches. Renders kernel output, captures keystrokes, hands lines to the kernel.
3. **Shell Kernel (pure TS, framework-agnostic, unit-tested).** Parser → pipeline executor → registries → VFS. No React imports. This is the testable heart.
4. **State (Zustand).** Single root store, sliced: `sessions`, `settings`, `theme`, `providers`, `ui`. Source of truth for everything UI.
5. **Persistence.** `localStorage` for small settings (sync, no flash); IndexedDB via `idb-keyval` for VFS snapshot, per-session history, installed packages.
6. **Server proxy.** Stateless route handlers; holds keys; routes + streams; rate-limits.

## Proposed source tree
```
src/
  app/
    layout.tsx               # root, injects pre-hydration theme script
    page.tsx                 # mounts <Workspace/>
    api/
      chat/route.ts          # streaming LLM proxy
      models/route.ts        # available models/providers
      health/route.ts
  components/
    workspace/               # TabBar, StatusLine, MobileKeyBar, CommandPalette
    terminal/                # XtermView (React↔xterm bridge), PromptInput
    skins/                   # one component per skin chrome (claude-code, matrix, …)
    settings/                # SettingsSheet, ThemePicker, ModelPicker, ByokForm
  kernel/
    parser.ts                # tokenize + pipeline AST
    pipeline.ts              # execute pipes/redirects/&&/;
    vfs.ts                   # virtual filesystem
    env.ts  history.ts
    commands/                # ls.ts cd.ts cat.ts ... (registry)
    apps/                    # figlet.ts cmatrix.ts hollywood.ts ... (registry)
    apt/                     # package registry + installer simulation
    ai/aiCommand.ts          # bridges shell ↔ /api/chat
    registry.ts              # command/app registries
  providers/                 # client describ. + server adapters
    types.ts                 # Provider interface (normalized chat+stream)
    gemini.ts groq.ts openrouter.ts byok.ts
    router.ts                # fallback chain
  themes/
    registry.ts              # ThemeManifest[] 
    manifests/               # claude-code.ts matrix.ts amber-crt.ts ...
    tokens.css               # CSS var contract
    fx/                      # CRT scanline/glow/flicker layers
  store/                     # zustand slices
  lib/                       # persistence, rate-limit client, utils
  hooks/                     # useTab, useTheme, useStreamingChat, useHotkeys
tests/                       # vitest (kernel, providers) + playwright (e2e)
public/                      # fonts, manifest.json (PWA), sw.js
docs/                        # this folder
```

## Key contracts
**Command/App module**
```ts
interface Command {
  name: string;
  help: string;
  usage?: string;
  // streams output chunks; ctx exposes vfs, env, args, stdin, signal (for interrupt)
  run(ctx: CommandContext): AsyncIterable<OutputChunk>;
}
```
**Theme manifest**
```ts
interface ThemeManifest {
  id: string; label: string;
  palettes: { dark: Palette; light: Palette }; // CSS var maps + xterm theme
  fonts: { mono: string; ui?: string };
  banner: (ctx: BannerCtx) => string;          // ASCII art + model/cwd line
  promptFormat: (ctx: PromptCtx) => string;     // e.g. "> " or "❯ "
  fx?: { scanlines?: boolean; glow?: boolean; flicker?: boolean; curve?: boolean };
  chrome?: React.ComponentType<ChromeProps>;    // optional bespoke layout
}
```
**Provider (normalized, server-side)**
```ts
interface Provider {
  id: string;
  stream(messages: ChatMsg[], opts: GenOpts, key?: string): AsyncIterable<TokenDelta>;
  // throws QuotaError/RateError so the router can fail over
}
```

## Data flow: a chat turn
1. User types into PromptInput (or shell falls through) → kernel `aiCommand`.
2. Client `fetch('/api/chat', {stream})` with messages + optional BYOK header + chosen model.
3. Server router picks provider (chosen or primary), streams tokens; on `QuotaError`/`RateError` transparently advances the fallback chain, emitting a `meta: switched` event.
4. Client renders deltas into xterm with a typewriter cadence; status line shows "thinking…"; Esc aborts the fetch via `AbortController`.

## Data flow: theme switch
`/ui matrix` (or button) → store sets `activeSkin` → root `data-skin="matrix" data-mode="dark"` → CSS vars cascade + xterm theme set imperatively + banner re-rendered. No reload, <100ms.

## State isolation across tabs
`store.sessions[id] = { cwd, env, history, chat: {messages, model}, xtermRef }`. VFS is a single shared instance. Switching tabs toggles visibility of pre-mounted xterm nodes; hidden tabs pause animations.
