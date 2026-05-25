# AGENTS.md — Mirage project memory

> opencode reads this file automatically. It is the single source of truth for *how* to work in this repo.

## Project
**Mirage** — a browser-based virtual Linux terminal + AI companion. A sandboxed JS shell that *feels* real (commands, fake `apt`, figlet/cmatrix/hollywood), with a free-API chatbot, runtime-swappable UI skins, day/night mode, and multi-tab sessions. Must be deployable for free.

Full spec lives in `docs/spec/`. Design reasoning in `docs/design-phase/`. Plan & sprints in `docs/agile/`. **Read those before writing code.**

## Tech stack (do not substitute without a note in docs)
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict).
- **Styling:** Tailwind CSS v4 + CSS custom properties for theming. No CSS-in-JS runtime.
- **State:** Zustand (one root store, sliced per concern). No Redux.
- **Terminal:** xterm.js + `@xterm/addon-fit`, `@xterm/addon-web-links`, `@xterm/addon-search`, `@xterm/addon-webgl`. React owns the "chrome" (tabs, header, status bar, skins); xterm owns the buffer.
- **AI proxy:** Next.js Route Handlers (`app/api/chat/route.ts`) streaming via `ReadableStream`/SSE. Provider keys are **server-only env vars**.
- **Persistence:** `localStorage` for settings; IndexedDB (`idb-keyval`) for VFS/history/installed packages.
- **Apps/libs:** `figlet`, custom JS for cmatrix/hollywood/cowsay/lolcat/sl/neofetch, `shell-quote` for tokenizing.
- **Testing:** Vitest (unit: shell parser, VFS, providers) + Playwright (e2e: tabs, theme switch, chat stream).
- **Deploy:** Vercel primary (Cloudflare Pages / Netlify alternates). Upstash Redis or platform KV for IP rate limiting.

## Working conventions
- **Plan before Build.** Use Plan mode to produce a step list per sprint, get it reviewed, then implement.
- **Work sprint by sprint** per `docs/agile/sprint-plan.md`. Do not jump ahead to later-sprint features.
- **Each command/app/provider/theme is a self-contained module** with a clear interface (see specs). Adding one must not require editing a giant switch — use registries.
- **Never hardcode or expose API keys.** Client never sees a provider key. BYO-key, if used, is forwarded through the proxy and never logged.
- **Accessibility & reduced-motion are not optional** — gate all FX behind `prefers-reduced-motion`.
- **Mobile must work** (the reference screenshots are mobile). Provide an on-screen key bar.
- **Keep modules small.** If a file exceeds ~300 lines, split it.
- **Commit per logical unit** with conventional-commit messages (`feat:`, `fix:`, `docs:`, `chore:`). Tag the sprint in the body.
- **Update the docs** when you make a design decision that deviates from the spec — add a dated note, don't silently diverge.

## Definition of Done (every story)
Builds with no TS errors · lint passes · unit tests for logic-heavy modules · works on desktop + mobile viewport · respects active theme + reduced-motion · no key leakage · doc updated if behavior changed.

## Non-goals (v1)
Real OS / WASM Linux (it's *simulated*) · user accounts / cloud sync · running untrusted real code · paid APIs as the default path.
