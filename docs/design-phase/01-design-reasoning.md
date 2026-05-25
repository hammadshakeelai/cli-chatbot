# 01 — Design Reasoning Log

The "store every single bit and reasoning" document. This captures *why* each major decision was made, the alternatives considered, and the problems solved up-front — so future-you (and opencode) never has to re-derive them.

---

## 0. Method
Before any planning, two facts were verified against the live web (May 2026):
1. **What opencode is** — a Go-based, terminal-first, open-source AI coding agent that reads an `AGENTS.md` for project memory, supports Plan/Build modes, and is bring-your-own-provider (Gemini, Groq, OpenRouter, etc.). → This is why the build target is a *prompt + AGENTS.md + spec docs*, structured for Plan→Build.
2. **Current free LLM APIs** — Google AI Studio / Gemini 2.5 Flash (~1,500 req/day, 1M context, no card), Groq (fastest, ~30 req/min on Llama 3.3 70B), OpenRouter (~30 free models, ~20 req/min, ~200/day each), Cerebras (1M tokens/day), Mistral (1B tokens/month). Google quietly cut free RPM in late 2025, so **rate limits are real and must be designed around**, not assumed away.

---

## 1. What is actually being built (decomposing the brief)
The brief is one big run-on idea. Decomposed, it is **five products stacked**:

1. A **simulated Linux shell** in the browser (commands, fake `apt`, fun apps).
2. An **AI chatbot** over free APIs, embedded in that shell.
3. A **runtime theme/skin engine** (`/ui` + GUI button) with day/night.
4. A **multi-tab session manager**.
5. A **deployable web app** with server-side key safety + abuse protection.

Naming it **Mirage** captures the core illusion: *it all works, but none of it is real.* That framing also resolves the biggest safety question instantly (see §7).

---

## 2. Terminal rendering: hybrid, not either/or
**Options:** (a) pure xterm.js, (b) fully custom React terminal.
- xterm.js gives authentic ANSI/cursor/scrollback for free → figlet, cmatrix, lolcat colors "just work." But it's hard to draw the *Claude Code rounded box chrome* and skinnable headers inside it.
- A custom React terminal gives total skin control but means re-implementing ANSI, scrollback, selection, mobile input — months of yak-shaving and bugs.

**Decision — HYBRID:** xterm.js renders the **scrollback buffer** (the command output). React renders the **chrome**: tab bar, header/banner box, status line, prompt, GUI buttons, and the per-skin styling. Skins restyle the React chrome + swap the xterm color theme. Best of both: authentic terminal, fully skinnable shell. This is the single most important architecture call.

---

## 3. The shell "kernel"
A custom JS kernel with four parts: **VFS**, **parser**, **command registry**, **app registry**.
- **VFS:** in-memory tree, persisted to IndexedDB. Shared across tabs (one filesystem, many terminals = realistic).
- **Parser:** start with `shell-quote` for tokenizing, build pipes `|`, redirects `> >>`, `&&`/`;`, `$VARS`, globbing on top. *Incremental* — v1 supports simple+pipes+`&&`; advanced quoting later. Trying to ship a full POSIX grammar on day one is the classic scope trap; explicitly avoided.
- **Command registry:** every command is `{ name, help, run(args, ctx): AsyncIterable<string> }`. Adding a command = drop a file in `commands/`. No mega-switch.
- **App registry:** same shape, but for the "fun" programs (figlet, cmatrix, …). Gated by the fake package manager so they feel installable.

**Why registries everywhere:** the brief says "many other types" of everything. The only scalable answer is *plugin registries*, so adding the 11th theme or 30th command is trivial and never touches core logic.

---

## 4. Fake `apt` (the illusion engine)
`apt install figlet` → look up a JSON package registry → animate a realistic download/unpack with progress bars → write an entry to `/var/lib/mirage/installed.json` → unlock the command. `apt update/list/search/remove` for flavor. The command stays "command not found" until installed, which sells the realism. Pure client-side JS, zero real install, zero risk.

---

## 5. AI integration & the rate-limit problem (the hard one)
The brief wants it free *and* deployed publicly. A naive build ships one shared key → first viral moment burns the 1,500 req/day quota in minutes and the app is dead. Solved by **layering**:

1. **Server proxy only.** All LLM calls go through `app/api/chat`. Keys live in host env vars. Client never sees a key.
2. **Provider abstraction + fallback chain.** Normalize Gemini/Groq/OpenRouter behind one streaming interface. Primary Gemini Flash → on 429/quota → Groq → OpenRouter `auto:free`. Friendly "switching model…" message, never a hard crash.
3. **Bring-Your-Own-Key (BYOK).** Power users paste their own key (stored in *their* browser, forwarded per-request, never logged). This is the pressure valve that makes a public deploy survivable.
4. **Abuse protection.** Per-IP rate limit (KV/Upstash), max tokens/request, daily per-IP cap, optional Turnstile if abused.
5. **Streaming.** SSE token streaming → the live-typing "Honking…" feel from the reference.

**Mode model:** unknown shell input falls through to the AI; `/chat` enters a dedicated chat mode; `ask "…"` is a one-shot command; `/`-prefixed = app control. This mirrors the reference (a prompt that's both shell-ish and chat-ish).

---

## 6. Theme/skin engine (the headline)
A **theme = palette (CSS vars + xterm theme) + chrome skin (React) + fonts + banner/ASCII art + prompt format + FX flags.** Stored as manifests in a registry; switched at runtime by flipping `data-skin`/`data-mode` on the root and swapping CSS variables → **instant, no reload**. Day/night is a global `data-mode` with each skin defining light+dark palettes; initial value read from `localStorage` via a blocking inline script to kill the flash-of-unstyled-content. Controls exposed both ways the brief asked: **`/ui` command and a GUI button** (plus a `Ctrl+K` command palette). CRT FX (scanlines/glow/flicker/curve) is a toggleable layer, auto-disabled under `prefers-reduced-motion`. Initial skins: claude-code (flagship, from the reference), opencode, openclaw, classic-green, amber-crt, matrix, dracula, synthwave, dos, hacker.

---

## 7. Safety, settled once
Because the shell is **simulated**, the AI has **no real system access** — it can *suggest* commands the sandbox then runs in-VFS, but it cannot touch the host. No RCE surface from `apt`/commands. The only real external call is the LLM proxy, which is locked down (keys server-side, rate-limited, never logged). This is why "Mirage" as a framing matters: the scary version of this idea (real terminal access to an AI) is explicitly *not* what we're building.

---

## 8. Multi-tab
Each tab = a **session**: own cwd, env, history, chat context, xterm instance; **shared** VFS. xterm instances are kept alive on tab-switch (hide/show, not destroy) to preserve scrollback. Tabs capped (≈10) for memory; heavy animations in hidden tabs are paused. Zustand holds a `sessions` map as the single source of truth.

---

## 9. Why Next.js + Vercel
Next.js gives the **serverless API route for the key proxy** in the same repo as the SPA — the cleanest way to satisfy "free API + deployed + keys safe." Vercel deploys it natively for free with env vars and KV; Cloudflare Pages/Workers and Netlify are documented alternates (good free tiers, edge streaming). GitHub→Vercel auto-deploy + preview deployments per PR fits the Agile loop.

---

## 10. Problems pre-solved (the "tick all boxes" checklist)
| Risk | Resolution |
|---|---|
| Free quota nuked on launch | BYOK + fallback chain + IP rate limit |
| API keys leaking | Server proxy only; never shipped; BYOK never logged |
| Shell scope explosion | Incremental parser; registries; phased sprints |
| xterm ↔ React lifecycle bugs | xterm kept in refs outside render; ResizeObserver + FitAddon |
| Animation jank / runaway loops | rAF, FPS cap, batched writes, Esc/Ctrl-C interrupt, pause when hidden |
| Theme flash (FOUC) | Blocking inline script sets theme pre-hydration |
| Mobile unusable (reference is mobile!) | Mobile-first; custom input feeding xterm; on-screen key bar |
| Accessibility | xterm a11y mode; reduced-motion; high-contrast skin; SR transcript |
| Memory bloat from many tabs | Tab cap; scrollback cap; dispose/pause hidden heavy work |
| AI has real system power | It doesn't — simulated shell, no host access |

Full treatment in `docs/spec/08-risks-and-mitigations.md`.

---

## 11. Conversation context
This plan was produced by Claude (Opus 4.7) in a design session, on request to "write a prompt for opencode." The deliverable is **documentation + a master prompt**, not application code — code is authored by opencode against `OPENCODE-MASTER-PROMPT.md`. The reference screenshots (Instagram, `vagonparovoz`) are described in `00-original-request.md` and drive the flagship skin.
