# 02 — Requirements (SRS)

IDs: `FR-x` functional, `NFR-x` non-functional. Each has acceptance criteria (AC). These map 1:1 to user stories in `docs/agile/product-backlog.md`.

## Functional requirements

### Shell core
- **FR-1 Terminal I/O.** A focused terminal accepts typed input, echoes it, runs on Enter, shows output, supports scrollback.
  - AC: typing `echo hi` + Enter prints `hi`; up/down arrows cycle history; Ctrl+L / `clear` clears.
- **FR-2 Virtual filesystem.** Hierarchical in-memory FS with a seeded home dir; persists across reloads.
  - AC: `mkdir x && cd x && pwd` → `/home/user/x`; survives refresh.
- **FR-3 Core commands.** ≥30: `ls cd pwd cat echo mkdir touch rm mv cp clear whoami uname neofetch history help man grep head tail wc env export date cal which whoami tree df uptime ps`.
  - AC: each has `--help`; `man <cmd>` shows usage; unknown command → `command not found` (then offered to AI).
- **FR-4 Shell operators.** Pipes `|`, redirects `>` `>>`, sequencing `&&` `;`, env expansion `$VAR`, glob `*`.
  - AC: `ls | grep .txt > out.txt && cat out.txt` works.
- **FR-5 Tab completion.** Tab completes commands and paths.
- **FR-6 Interrupt.** Ctrl+C / Esc cancels a running command or animation (cf. "esc to interrupt").

### Fake package manager + apps
- **FR-7 apt simulation.** `apt update|search|list|install|remove` with animated progress; installed state persisted; gates app availability.
  - AC: `figlet hi` before install → not found; `apt install figlet` → progress → `figlet hi` renders ASCII banner.
- **FR-8 Bundled apps.** figlet, cmatrix, hollywood, cowsay, lolcat, sl, neofetch, nyancat, toilet, fortune. Animated ones honor interrupt + reduced-motion.

### AI chatbot
- **FR-9 Streamed chat.** Talk to an LLM with token streaming. Triggers: `/chat` mode, `ask "…"` one-shot, and unknown-input fallthrough.
  - AC: response renders incrementally; a status indicator shows while generating; Esc interrupts.
- **FR-10 Multi-provider + fallback.** Gemini → Groq → OpenRouter chain; auto-failover on quota/error with a visible "switched model" notice.
- **FR-11 Model/provider switch.** `/model <id>` and a GUI picker; per-tab selectable.
- **FR-12 BYOK.** User can supply their own key (per provider), stored client-side only, used for their requests.
- **FR-13 AI personality.** A configurable system prompt gives a friendly retro-terminal persona; it may suggest commands but cannot execute on the host.

### UI / theming
- **FR-14 Runtime skin switch.** `/ui <name>` and a GUI button change the entire look instantly (no reload). ≥8 skins incl. faithful `claude-code`.
  - AC: `/ui matrix` swaps chrome + xterm palette + banner in <100ms.
- **FR-15 Day/Night.** `/day` `/night` + toggle button; remembers choice; defaults to system preference.
- **FR-16 CRT FX.** Per-skin scanlines/glow/flicker/curvature, toggleable; auto-off under `prefers-reduced-motion`.
- **FR-17 Command palette.** `Ctrl+K` fuzzy palette for themes, models, tabs, commands.
- **FR-18 Banners.** Each skin shows an ASCII/art banner with dynamic model + cwd line (mirrors the reference).

### Tabs & sessions
- **FR-19 Multi-tab.** Create/close/rename/reorder tabs; `Ctrl+T`/`Ctrl+W`/`Ctrl+Tab`. Each tab independent shell+chat; shared VFS.
- **FR-20 Persistence.** Settings (skin, mode, model, layout) + VFS + history + installed pkgs persist locally.
- **FR-21 Session export.** Export the active session transcript as `.txt`/`.md`/`.json`.

### Help & onboarding
- **FR-22 Onboarding.** First load shows a friendly banner + `help` hint + 1-line tour; `/help` lists slash commands; `help` lists shell commands.

## Non-functional requirements
- **NFR-1 Performance.** First contentful paint <2s on 4G; theme switch <100ms; 60fps animations on mid-range mobile (or graceful FPS cap).
- **NFR-2 Mobile.** Fully usable on a phone; on-screen key bar (Esc, Ctrl, Tab, arrows, `/`, `|`, `~`); pinch-zoom font.
- **NFR-3 Accessibility.** WCAG AA contrast on default skins; xterm screen-reader mode; reduced-motion respected; keyboard-only operable.
- **NFR-4 Security.** No provider key ever reaches the client; BYOK never logged server-side; all proxy calls over HTTPS; CSP set; no real host access from shell/AI.
- **NFR-5 Cost.** $0 to operate at low/medium traffic on free tiers; survives spikes via BYOK + rate limiting (no surprise bills).
- **NFR-6 Reliability.** Provider failure degrades gracefully (fallback + clear message); offline → shell works, chat shows "offline."
- **NFR-7 Maintainability.** New command/app/provider/theme = one small module + one registry line; modules <300 lines; strict TS; tests on logic.
- **NFR-8 Portability.** Deployable to Vercel, Cloudflare Pages, or Netlify with only env-var changes.
- **NFR-9 Privacy.** No third-party analytics by default; chat content not persisted server-side; clear local-only data policy.
- **NFR-10 PWA.** Installable; service worker caches the shell shell so it opens offline.
