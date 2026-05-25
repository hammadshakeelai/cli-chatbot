# Mirage 🖥️✨
### *A terminal that isn't there.*

Mirage is a **browser-based virtual Linux terminal + AI companion**. It looks and feels like a real shell — `ls`, `cd`, `apt install`, `figlet`, `cmatrix`, `hollywood`, `neofetch` all "work" — but everything runs in a sandboxed JavaScript kernel in your browser. No real OS, no real risk, pure vibe.

On top of the fake-but-convincing shell sits a **free-API-powered chatbot**, a **swappable UI skin system** (`/ui claude-code`, `/ui matrix`, `/ui amber-crt`, …), a **day/night toggle**, and a **multi-tab interface** where each tab is its own independent session.

> Working name is **Mirage** — rename freely (it's a single constant). Other candidates: `GhostShell`, `Nebula`, `Phantom`.

---

## What it does (at a glance)

- 🐚 **Simulated Linux shell** — real-feeling commands, pipes, redirects, env vars, a virtual filesystem, command history, tab-completion.
- 📦 **Fake package manager** — `apt install figlet` shows a real-looking download, then `figlet` actually works. (`figlet`, `cmatrix`, `hollywood`, `cowsay`, `lolcat`, `sl`, `neofetch`, `nyancat`, `toilet`, `fortune` … all bundled, gated behind "install" for the illusion.)
- 🤖 **AI chatbot** — talk to a free LLM (Gemini / Groq / OpenRouter), streamed token-by-token. Unknown input falls through to the AI; `/chat` toggles a dedicated chat mode.
- 🎨 **Swappable UI skins** — switch the entire look at runtime via `/ui <name>` **or** a GUI button. Ships with Claude Code, OpenCode, OpenClaw, Classic Green, Amber CRT, Matrix, Dracula, Synthwave, DOS/Win95, Hacker.
- 🌗 **Day / Night** — global light/dark toggle (`/day`, `/night`, button, or system-preference aware).
- 🗂️ **Multi-tab** — `Ctrl+T` new tab, each with its own shell state + chat context; shared filesystem.
- 🖥️ **CRT FX** — optional scanlines, glow, flicker, curvature (respects `prefers-reduced-motion`).
- 🚀 **Deployable** — ships to Vercel / Netlify / Cloudflare Pages for free; API keys stay server-side; optional bring-your-own-key.

---

## Repo layout

```
mirage-terminal/
├── README.md                  ← you are here
├── AGENTS.md                  ← project memory for opencode (read first by the agent)
└── docs/
    ├── design-phase/          ← the "why": original request, reasoning, the build prompt
    │   ├── 00-original-request.md
    │   ├── 01-design-reasoning.md
    │   └── OPENCODE-MASTER-PROMPT.md   ⭐ paste THIS into opencode
    ├── spec/                  ← the "what": full specification
    │   ├── 01-vision-and-scope.md
    │   ├── 02-requirements-SRS.md
    │   ├── 03-architecture.md
    │   ├── 04-terminal-engine.md
    │   ├── 05-ui-themes.md
    │   ├── 06-ai-providers.md
    │   ├── 07-deployment.md
    │   └── 08-risks-and-mitigations.md
    └── agile/                 ← the "how + when": backlog & sprints
        ├── product-backlog.md
        └── sprint-plan.md
```

## How to use this repo

1. Read `docs/design-phase/01-design-reasoning.md` to understand the decisions.
2. Skim the `docs/spec/` files for the full picture.
3. Open opencode in this folder and paste `docs/design-phase/OPENCODE-MASTER-PROMPT.md` (or run `/init` then point it at the docs). opencode will plan, then build, sprint by sprint.

## Target stack (pinned in the spec)

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · xterm.js (+ addons) · figlet.js · serverless API routes for the LLM proxy · Vercel/Cloudflare deploy.

---

*Generated in the design phase. Everything here is documentation — no application code yet. The code gets written by opencode following `OPENCODE-MASTER-PROMPT.md`.*
