# Product Backlog

Agile backlog: **epics → user stories** with acceptance criteria (AC) and a rough size (S/M/L). Stories trace to `FR-*` in the SRS. Prioritized; MVP marked ⭐.

## Epic 1 — Foundation & shell shell ⭐
- **US-1.1** ⭐ (M) As a user, I see a terminal that boots with a banner and accepts input.
  - AC: page loads <2s; banner + prompt visible; typing echoes; Enter runs. (FR-1, FR-22)
- **US-1.2** ⭐ (M) As a user, my commands run against a virtual filesystem.
  - AC: `mkdir/cd/ls/cat/echo/touch/rm/mv/cp/pwd` work; persists across reload. (FR-2, FR-3)
- **US-1.3** ⭐ (S) As a user, I can recall history and clear the screen.
  - AC: up/down history; `clear`/Ctrl+L; `history`. (FR-1)
- **US-1.4** (M) As a user, I can pipe and chain commands.
  - AC: `ls | grep x && echo ok`; `$VAR`; `> file`. (FR-4)
- **US-1.5** (S) Tab-completion for commands and paths. (FR-5)
- **US-1.6** (S) Ctrl+C/Esc interrupts a running command. (FR-6)

## Epic 2 — Fake apt & fun apps ⭐(partial)
- **US-2.1** ⭐ (M) As a user, `apt install <pkg>` simulates a real install and unlocks a tool. (FR-7)
  - AC: tool is "not found" before; animated install; works after; persists.
- **US-2.2** ⭐ (M) figlet, neofetch, cowsay, lolcat available. (FR-8)
- **US-2.3** (M) cmatrix, hollywood, sl, nyancat with interrupt + reduced-motion. (FR-8, C2)
- **US-2.4** (S) fortune + `apt search/list/remove/update`.

## Epic 3 — AI chatbot ⭐
- **US-3.1** ⭐ (L) As a user, I can chat with an AI and see the reply stream in. (FR-9)
  - AC: `ask "hi"` streams; status indicator; Esc aborts.
- **US-3.2** ⭐ (L) Server proxy with Gemini primary; keys server-side. (NFR-4, B2)
- **US-3.3** ⭐ (M) Fallback chain Gemini→Groq→OpenRouter with visible switch notice. (FR-10, B1)
- **US-3.4** (M) `/chat` mode + unknown-input fallthrough to AI. (FR-9)
- **US-3.5** (M) BYOK in settings, client-only, never logged. (FR-12, B2)
- **US-3.6** (M) Per-IP rate limiting + token caps. (NFR-5, B5)
- **US-3.7** (S) `/model` + GUI model picker; per-tab model. (FR-11)
- **US-3.8** (S) Editable persona/system prompt. (FR-13)

## Epic 4 — Theme & UI engine ⭐(partial)
- **US-4.1** ⭐ (M) CSS-var theme contract + `claude-code` flagship skin pixel-matched to reference. (FR-14, FR-18)
- **US-4.2** ⭐ (S) `/ui <id>` + GUI theme picker switch instantly, no reload. (FR-14)
- **US-4.3** ⭐ (S) Day/Night toggle (`/day` `/night` + button), no FOUC, system-default. (FR-15, D1)
- **US-4.4** (M) 7 more skins (opencode, openclaw, classic-green, amber-crt, matrix, dracula, synthwave/dos/hacker).
- **US-4.5** (M) CRT FX layer, reduced-motion aware, FX-off switch. (FR-16, D4)
- **US-4.6** (S) `Ctrl+K` command palette. (FR-17)

## Epic 5 — Tabs & persistence ⭐(partial)
- **US-5.1** ⭐ (M) Multi-tab: new/close/switch; isolated shell+chat; shared VFS. (FR-19)
- **US-5.2** (S) Rename/reorder tabs; keyboard shortcuts. (FR-19)
- **US-5.3** (S) Persist settings + VFS + history + installed pkgs. (FR-20)
- **US-5.4** (S) Export session transcript. (FR-21)

## Epic 6 — Mobile, a11y, PWA, deploy ⭐(deploy)
- **US-6.1** ⭐ (M) Mobile-first layout + on-screen key bar. (NFR-2, E1)
- **US-6.2** (M) A11y: reduced-motion, contrast, SR mode, keyboard-only. (NFR-3)
- **US-6.3** (S) PWA installable + offline shell. (NFR-10, E4)
- **US-6.4** ⭐ (M) Deploy to Vercel with env keys + rate limit + preview deploys. (NFR-8, deploy)
- **US-6.5** (S) Pre-launch checklist green (security/perf/mobile). 

## Epic 7 — Polish & delight (post-MVP)
- Sound FX (opt-in keyclicks/boot chime), boot sequence animation, more ASCII art, more cowsay characters, `Ctrl+R` reverse-search, `!n` history re-run, settings import/export, shareable theme codes.

## MVP definition
Epics 1–6 starred stories = a deployable, mobile-friendly terminal with VFS+core commands, fake apt + a few apps, streaming AI with fallback+BYOK+rate-limit, the `claude-code` skin + `/ui` + day/night, multi-tab, persistence, and a live Vercel URL.
