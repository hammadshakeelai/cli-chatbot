```text
PS C:\Users\user> mirage --banner

███╗   ███╗██╗██████╗  █████╗  ██████╗ ███████╗
████╗ ████║██║██╔══██╗██╔══██╗██╔════╝ ██╔════╝
██╔████╔██║██║██████╔╝███████║██║  ███╗█████╗
██║╚██╔╝██║██║██╔══██╗██╔══██║██║   ██║██╔══╝
██║ ╚═╝ ██║██║██║  ██║██║  ██║╚██████╔╝███████╗
╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
          a PowerShell that isn't there · v2
```

# Mirage Terminal 🖥️

### *A PowerShell that isn't there.*

A simulated **Windows Terminal + PowerShell** in the browser — with convincing, terminal-native
simulations of real **agentic AI CLIs** living inside it:

```
PS C:\Users\user> claude        ← Claude Code (welcome box, spinner, tool calls)
PS C:\Users\user> antigravity   ← Google Antigravity (gradient ASCII, plan checklists)
PS C:\Users\user> gemini        ← Gemini CLI (the big gradient wordmark)
PS C:\Users\user> copilot       ← GitHub Copilot CLI
PS C:\Users\user> opencode      ← opencode
PS C:\Users\user> codex         ← OpenAI Codex CLI
PS C:\Users\user> mythos        ← Mythos OS (cyber-security rig)
```

The shell, the filesystem, and the agents' tool activity are **theater** (sandboxed, in-memory,
zero host access). The **AI replies are real** — streamed from free LLM providers
(Gemini / Groq / OpenRouter) through a server-side proxy.

Full specification: [`SPEC.md`](./SPEC.md).

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then paste at least one free API key
npm run dev                    # http://localhost:3000
```

> **The keys currently in `.env.local` are dummies.** Without a real key the agents boot fine
> but replies fail with a guidance message. Get a free key from any of:
> [Google AI Studio](https://aistudio.google.com/apikey) ·
> [Groq](https://console.groq.com/keys) ·
> [OpenRouter](https://openrouter.ai/keys) — or paste one at runtime in
> **Settings (⚙) → Bring your own API key**.

## What's inside

- **Windows Terminal chrome** — tabs in the title bar, profile dropdown (⌄), rename/duplicate/
  close-others context menu, working window buttons, status bar, command palette
  (`Ctrl+Shift+P` / `Ctrl+K`), settings dialog, toasts, optional CRT effects, mobile key bar.
- **PowerShell 5.1 feel** — authentic banner & errors, `PS C:\Users\user>` prompt, cmdlets +
  aliases (`Get-ChildItem`/`dir`/`ls`, `cd`, `cat`, `tree /f`, `sls`, …), pipes `|`,
  redirects `>` `>>`, `;`/`&&`, globs, `$env:VAR`, `$PSVersionTable`, tab-completion
  (commands **and** paths, cycling), history (`↑↓`, `Ctrl+R`), full line editing.
- **A real-feeling fake machine** — case-insensitive `C:\` filesystem with a seeded
  `~\projects\demo-app` the agents "read" during tool calls; `winfetch`, `winget install`
  (progress-bar theater), `ping`, `cmatrix`, `figlet`, `cowsay`, `lolcat`.
- **Agent runtime** — banner → ghost-hint prompt → verb spinner with elapsed time → simulated
  tool calls / plan checklists → **markdown-styled streamed reply** → footer. `/help`, `/clear`,
  `/model`, `/status`, `/exit`, Esc interrupts, double-Ctrl+C exits.
- **8 color schemes** (Campbell default) × dark/light, applied live to chrome + every terminal.

## Commands

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `start` | production |
| `npm run typecheck` | strict TS |
| `npm run test` | vitest unit tests |
| `npm run test:e2e` | Playwright e2e (boots dev server) |
| `npm run lint` | eslint |

## Architecture (short version)

```
src/term     xterm sessions (one per tab, never rebuilt), line editor,
             spinner, streaming markdown→ANSI printer
src/shell    PowerShell engine: WinFS, parser, pipeline, ~40 commands
src/agents   agent definitions + shared REPL runtime + tool-call theater
src/ui       React chrome (titlebar/tabs/dialogs/palette/statusbar)
src/store    zustand UI state (tabs, settings) — engine lives outside React
src/providers + app/api   LLM proxy: Gemini → Groq → OpenRouter fallback
```

Sessions are imperative objects owned by a manager outside React — switching tabs or themes
never recreates a terminal, so buffers, history, and running agents survive.

## Safety

No real OS access. No real files. Provider keys stay server-side (`.env.local`); an optional
bring-your-own key is stored only in your browser and forwarded per-request. The security
persona (`mythos`) gives defensive guidance only.
