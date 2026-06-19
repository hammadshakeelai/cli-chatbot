# SPEC — Mirage Terminal v2 "Real PowerShell" Rebuild

> Spec sheet for the from-scratch rebuild. Old implementation (Linux kernel + skin-personas +
> popup AI panel) is replaced. This document is the source of truth for v2.

---

## 1. Vision

A browser app that looks and feels like **Windows Terminal running PowerShell** — and inside
that shell you can launch **convincing simulations of real agentic AI CLIs** (`claude`,
`antigravity`, `gemini`, `copilot`, `opencode`, `codex`, `mythos`) that boot with authentic
banners, show tool-call activity, stream answers token-by-token, and exit cleanly back to the
shell. Everything is sandboxed; the AI replies are real (free LLM providers via the existing
server proxy), the "agentic" tool activity is simulated theater.

Design pillars:
1. **Authenticity** — every pixel should pass for Windows Terminal + the real CLI tools.
2. **Simplicity** — agents look like the real thing: minimal, calm, no gimmick walls.
3. **Smoothness** — one xterm instance per tab kept alive; no remount flashes; in-place
   spinners; streamed output; no layout jank.
4. **Everything clickable works** — every button has a real, sensible behavior.

---

## 2. What is kept / replaced

| Area | Decision |
|---|---|
| `src/providers/*`, `/api/chat`, `/api/models`, rate-limiter | **Keep** (works; keys configured) |
| `src/kernel/*` (Linux shell) | **Replace** with PowerShell engine (`src/shell/`) |
| `src/themes/manifests/*` (15 skins w/ banners+prompts) | **Replace** with pure color schemes (`src/themes/schemes.ts`); banners/prompts move to agents |
| `src/store/index.ts` (god store, mutable classes inside zustand) | **Replace**: engine state lives outside React; zustand only holds reactive UI state |
| `XtermView` (recreates terminal on every theme/tab change) | **Replace**: persistent per-tab sessions, show/hide, live theme update |
| `AiPanel` (HTML chat popup duplicating the terminal) | **Remove** — agents are terminal-native |
| `TabBar`, `SettingsPanel`, `CommandPalette`, `MobileKeyBar` | **Rebuild** from scratch |
| Mythos persona, sound fx, CRT overlay idea | **Keep**, reimplemented |
| Root debug scripts (`*-debug.cjs`, `verify.cjs`, …), `CONTINUATION_PROMPT.md` | **Delete** (stale) |
| IndexedDB persistence of full VFS/sessions | **Drop** — settings persist in `localStorage`; FS is fresh per load (consistent demo content) |

---

## 3. UI / window chrome (Windows Terminal look)

```
┌──────────────────────────────────────────────────────────────────┐
│ ⊞ │ ⏷ PowerShell ×│ ✳ Claude Code ×│ +  ⌄ │        ─  ▢  ✕ │  ← title bar (40px)
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   (xterm.js terminal — fills everything)                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ⌂ PowerShell  C:\Users\user      gemini-2.5-flash · ☾ · ⚙ · ⛶  │  ← status bar (26px)
└──────────────────────────────────────────────────────────────────┘
```

- **Title bar**: dark (`#1f1f1f` family), tabs sit in it like Windows Terminal.
  - Tab: profile icon (colored), title, close `×` on hover. Active tab = terminal bg + subtle
    top accent. Inactive = transparent, hover highlight.
  - Tab titles update live (shell sets `PowerShell`/cwd; agents set e.g. `✳ Claude Code`).
  - Double-click renames. Right-click context menu: Rename / Duplicate / Close / Close others.
  - `+` opens a new default PowerShell tab. `⌄` opens the **profile dropdown**:
    - Shells: Windows PowerShell
    - AI agents: Claude Code, Antigravity, Gemini CLI, GitHub Copilot, OpenCode, Codex, Mythos OS
    - Footer rows: Settings (Ctrl+,), Command Palette (Ctrl+Shift+P), About
  - Agent profile tabs boot PowerShell, **auto-type the agent command** (e.g. `claude⏎`) like a
    real Windows Terminal profile `commandline`.
  - Window buttons: `─` playful toast (browser can't minimize), `▢` toggles fullscreen,
    `✕` Windows-Terminal-style "Close all tabs?" confirm dialog → resets to one fresh tab.
- **Status bar** (thin, dim): left = active profile + cwd + busy spinner during generation;
  right = model badge (click → palette filtered to models), dark/light toggle, settings gear,
  fullscreen. All clickable.
- **Dialogs**: Settings, About, Confirm — consistent modal style, Esc/✕/outside-click close.
- **Command palette** (Ctrl+Shift+P, Ctrl+K alias): fuzzy actions — new tabs (all profiles),
  color schemes, models, toggles, settings, about, fullscreen, clear terminal.
- **Toasts**: bottom-right small notices (theme changed, copied, minimize joke).
- **Mobile**: key bar above status bar (Tab, Esc, Ctrl+C, ↑ ↓, `|`, `\`, `-`, `"`) injecting
  into the active session; layout works at 375px.
- **Keyboard**: Ctrl+T new tab, Ctrl+W close, Ctrl+Tab cycle, Ctrl+Shift+P/Ctrl+K palette,
  Ctrl+, settings, Ctrl+L clear, Esc / Ctrl+C interrupt.
- Settings: color scheme grid (live preview swatches), font size slider, cursor blink,
  CRT effects toggle, key-click sound toggle, default AI model, BYOK key (password field,
  stored locally, never logged), reset-all. Persisted to `localStorage`.

## 4. PowerShell experience (`src/shell/`)

- **Boot banner** (authentic):
  ```
  Windows PowerShell
  Copyright (C) Microsoft Corporation. All rights reserved.

  Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows
  ```
- **Prompt**: `PS C:\Users\user> ` (bright, path live-updates).
- **Filesystem**: in-memory Windows FS — `C:\` drive, case-insensitive, `\` and `/` accepted.
  Seeded: `C:\Users\user\{Desktop, Documents, Downloads, Pictures, notes.txt, todo.md}`,
  `C:\Users\user\projects\demo-app\{package.json, README.md, src\index.ts, src\utils.ts}`,
  `C:\Windows\System32`, `C:\Program Files`, `C:\Temp`. (Gives agents real paths for theater.)
- **Commands** (cmdlet + aliases, PowerShell-style output):
  - FS: `Get-ChildItem` (ls, dir, gci) — real PS table (Mode/LastWriteTime/Length/Name),
    `Set-Location` (cd, sl), `Get-Location` (pwd, gl), `Get-Content` (cat, type, gc),
    `New-Item` (ni, touch), `mkdir` (md), `Remove-Item` (rm, del, rd, rmdir),
    `Copy-Item` (cp, copy), `Move-Item` (mv, move), `Rename-Item` (ren), `tree`.
  - Text: `Write-Output` (echo), `Select-String` (sls, findstr, grep), `Measure-Object` (wc-ish).
  - System: `Clear-Host` (cls, clear), `Get-Date` (date), `Get-Process` (ps, gps), `whoami`,
    `hostname`, `systeminfo`, `ver`, `Get-History` (history, h), `Get-Command` (gcm),
    `Get-Help` (help, man), `ipconfig`, `ping` (animated fake), `Start-Sleep` (sleep), `exit`.
  - Variables: `$env:NAME` expansion, `$PSVersionTable` special-case.
  - Fun: `winfetch`/`neofetch` (Win11 logo sysinfo), `figlet`, `cowsay`, `cmatrix`/`matrix`,
    `lolcat` (pipe-aware).
  - Theater: `winget install <pkg>` — realistic download/progress UI.
  - Easter eggs: `wsl`, `code`, `explorer` give in-character one-liners.
  - AI: `claude`, `antigravity`, `gemini`, `copilot`, `opencode`, `codex`, `mythos` launch
    agents; `agents` lists them with descriptions.
- **Operators**: quoting, `|` pipes, `>` `>>` redirects, `;`, `&&`, `*` globs.
- **Errors**: authentic PowerShell 5.1 red block:
  ```
  foo : The term 'foo' is not recognized as the name of a cmdlet, function, script file,
  or operable program. Check the spelling of the name, or if a path was included, verify
  that the path is correct and try again.
  At line:1 char:1
  + foo
  + ~~~
      + CategoryInfo          : ObjectNotFound: (foo:String) [], CommandNotFoundException
      + FullyQualifiedErrorId : CommandNotFoundException
  ```
  If the input looks like natural language (≥3 words / ends with `?`), append a dim tip:
  `Tip: type 'claude' or 'agents' to talk to an AI.`
- **Line editor** (new, proper): cursor ←/→, Home/End, Ctrl+←/→ word jump, insert/delete
  mid-line, Backspace/Delete, Ctrl+U/K/W kills, paste (multi-char onData), ↑/↓ history,
  Ctrl+R reverse-search, Tab completion (commands + paths, cycling), Ctrl+C cancels line,
  Ctrl+L clears. Handles wrapped lines correctly.

## 5. Agent CLIs (`src/agents/`) — the centerpiece

**Framework**: each agent is a data definition + shared `AgentRepl` runtime. Launching pushes
a REPL onto the session (shell suspends underneath, resumes on exit).

**Lifecycle of a message** (smooth, all in-terminal):
1. Styled prompt with dim **ghost hint** (e.g. `Try "explain this project"`) that vanishes on
   first keypress.
2. On submit → **spinner phase**: animated glyph + cycling verb + elapsed seconds + esc hint,
   updated in place (`✻ Pondering… (3s · esc to interrupt)`).
3. **Theater phase** (only when the query warrants it): 1–3 plausible simulated tool calls
   with staged delays, referencing *real paths from the fake FS*:
   ```
   ⏺ Read(C:\Users\user\projects\demo-app\src\index.ts)
     ⎿  Read 38 lines
   ⏺ Bash(npm test)
     ⎿  12 passed (1.4s)
   ```
4. **Stream phase**: real LLM reply (persona per agent, plain markdown) streamed through a
   **markdown→ANSI renderer** (bold/italic/inline-code/headings/bullets/fences/word-wrap) —
   agent-colored reply glyph (`⏺` / `✦` / `◉` …).
5. Dim completion footer where authentic (e.g. Codex token line).

**Controls inside an agent**: `/help`, `/clear`, `/model`, `/status`, `/exit` (+ `exit`),
Esc interrupts a running response, Ctrl+C twice exits (with the authentic
"Press Ctrl-C again to exit" hint). Conversation context kept per tab.

**The agents** (binary → look):

| Binary | Look & feel |
|---|---|
| `claude` | Claude Code: orange ✻, authentic `╭─╮` welcome box ("✻ Welcome to Claude Code!", /help line, cwd), `>` prompt, whimsical spinner verbs (Pondering, Vibing, Honking…), tools Read/Grep/Bash/Edit/WebSearch with `⏺`/`⎿`, model `claude-opus-4-8` |
| `antigravity` | **Google Antigravity**: figlet ASCII wordmark with blue→teal gradient + orbit tagline, `◉ ›` prompt, **plans like a manager**: prints a short task checklist (`☐ → ✓` animating) before answering, model `gemini-3-pro`, tools Read/Browse/Run |
| `gemini` | Gemini CLI: big GEMINI ANSI-shadow art with blue→purple gradient, "Tips for getting started" lines, `> ` prompt, ✦ replies, braille spinner |
| `copilot` | GitHub Copilot CLI: purple, goggles mini-art, `❯` prompt, suggests a next step at the end |
| `opencode` | opencode: monochrome block wordmark, ultra-minimal, `❯` prompt, terse output |
| `codex` | OpenAI Codex CLI: `╭─╮` info box (`>_ OpenAI Codex (v0.48.0)`), `›` prompt, "Thinking" italic phase, token footer |
| `mythos` | Mythos OS (kept): red phase-crab art, `root@mythos:~#` prompt, security persona |

**Honesty layer**: `/status` shows the *actual* backing provider/model; banners show the
fictional display model. Personas instruct plain text + light markdown (no model-emitted ANSI
— the renderer owns styling, so output is always clean).

## 6. Theming

- **Color schemes** (global, dark+light variants each): `Campbell` (WT default, default),
  `One Half Dark`, `Dracula`, `Matrix`, `Classic Green`, `Amber CRT`, `Synthwave`, `Mythos`.
- Scheme applies live to chrome CSS vars + every open xterm (no remount).
- Dark/light mode toggle; CRT overlay (scanlines/glow) optional, off by default,
  `prefers-reduced-motion` respected.
- Fonts: `Cascadia Code/Mono → Consolas → JetBrains Mono → monospace`; UI `Segoe UI`.
- Agents do **not** retheme the terminal (authentic: real CLIs inherit your terminal colors);
  they bring ANSI accents only. Mythos is the one exception (launching it switches scheme).

## 7. Architecture

```
src/
  app/            layout, page, globals.css, api/ (kept)
  store/ui.ts     zustand: tabs meta, activeId, settings, dialogs, toasts
  term/           ansi.ts, lineEditor.ts, streamPrinter.ts (md→ansi+wrap), spinner.ts,
                  session.ts (xterm + REPL stack), manager.ts (Map<id, Session>)
  shell/          winfs.ts, parse.ts, shell.ts (ShellRepl), commands/ (registry by category)
  agents/         types.ts, registry.ts, runner.ts (AgentRepl), theater.ts, banners.ts, defs/
  themes/         schemes.ts, apply.ts
  ui/             WindowChrome, TerminalMount, StatusBar, SettingsDialog, CommandPalette,
                  ConfirmDialog, AboutDialog, MobileKeyBar, Toasts
  providers/      (kept) gemini/groq/openrouter/grok + router + sse
  lib/            constants, rate-limiter (kept), sound, persist (localStorage)
```

- Sessions are **imperative objects outside React** (xterm instance, REPL stack, FS ref,
  history). React mounts their container divs and shows/hides them — terminals are created
  once per tab and never rebuilt on theme/tab changes.
- One shared `WinFS` across tabs (like a real machine); per-tab cwd/history/chat.
- Streaming: `/api/chat` SSE → AgentRepl → StreamPrinter → xterm (word-wrapped, styled).

## 8. Non-goals

Real OS access · real tool execution · user accounts · per-tab schemes · WSL simulation ·
full PowerShell language (scripting, objects, functions) — only the interactive feel.

## 9. Acceptance checklist

- [ ] Boots straight into an authentic PowerShell tab (banner, prompt, cursor).
- [ ] `dir`, `cd`, `cat`, `tree`, pipes, redirects, tab-completion, history all behave.
- [ ] Unknown command → authentic red PS error (+ AI tip when conversational).
- [ ] `claude` boots the Claude Code box; ask something → spinner → plausible tool calls →
      streamed styled answer → prompt; `/exit` returns to PowerShell cleanly.
- [ ] `antigravity` shows gradient ASCII + planning checklist; `gemini` shows gradient GEMINI.
- [ ] All 7 agents launchable from shell *and* from the new-tab dropdown (auto-typed).
- [ ] Tabs: create/close/switch/rename/duplicate/reorder-safe; titles live-update; no flicker
      on switch; terminals keep their buffer.
- [ ] Every button does something sensible (window buttons, status bar, dialogs, palette).
- [ ] Scheme/mode/font-size changes apply instantly to chrome + all terminals, persist.
- [ ] Esc/Ctrl+C interrupt streaming everywhere; double Ctrl+C exits agent.
- [ ] `npm run typecheck`, `npm run test`, `npm run build` all pass.
- [ ] Works at 375px width with the mobile key bar.
