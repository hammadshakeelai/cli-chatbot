# OPENCODE MASTER PROMPT  ⭐
### Paste this into opencode (running inside the `mirage-terminal/` folder).

> Tip: run opencode in this repo, do `/init` once so it ingests `AGENTS.md` and `docs/`, then paste the **Kickoff** block. For each sprint, use **Plan mode first**, let it show the plan, approve, then switch to **Build**. Don't let it build more than one sprint at a time.

---

## KICKOFF (paste this first)

```
You are building "Mirage" — a browser-based virtual Linux terminal + AI companion.
The full design lives in this repo: read these before doing anything:
  - AGENTS.md
  - docs/design-phase/01-design-reasoning.md
  - docs/spec/01..08 (vision, SRS, architecture, terminal-engine, ui-themes, ai-providers, deployment, risks)
  - docs/agile/product-backlog.md and sprint-plan.md
  - docs/design-phase/00-original-request.md (the reference screenshots describe the flagship "claude-code" skin)

Hard constraints (non-negotiable):
  1. Provider API keys NEVER reach the client. All LLM calls go through a Next.js server route (/api/chat). Keys are server env vars. BYOK is forwarded per-request and never logged.
  2. The shell is SIMULATED. No real OS/host access. The AI can suggest commands but cannot execute on the host.
  3. The free-tier AI must survive a traffic spike: provider fallback chain + BYOK + per-IP rate limiting.
  4. Mobile must work (the reference is a phone). Animations must be interruptible (Esc/Ctrl-C) and respect prefers-reduced-motion.
  5. Everything is a registry plugin: commands, apps, providers, themes. No mega-switch statements. Modules under ~300 lines.

Tech stack (don't substitute without writing a dated note in docs):
  Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind v4 + Zustand +
  xterm.js (+ @xterm/addon-fit, -web-links, -search, -webgl) + figlet + shell-quote +
  idb-keyval (IndexedDB) + Vitest + Playwright. Deploy: Vercel (+ Upstash/KV for rate limiting).

Architecture: React owns the skinnable "chrome" (tabs, banner, status, GUI buttons, command palette);
xterm.js owns the scrollback buffer; a pure-TS "kernel" (parser → pipeline → command/app registry → VFS)
has zero React imports and is unit-tested. See docs/spec/03-architecture.md for the source tree to follow.

Process: follow docs/agile/sprint-plan.md. Work ONE sprint at a time. For each sprint:
  (a) enter PLAN mode and produce a concrete step list + file list + test list;
  (b) wait for my approval;
  (c) BUILD it, committing per story with conventional-commit messages;
  (d) ensure the Definition of Done (in sprint-plan.md) passes before moving on.

Start now with Sprint 0 (project scaffold) in PLAN mode only. Do not write code yet — show me the plan.
```

---

## PER-SPRINT DRIVER (use at the start of each sprint)

```
Begin Sprint <N> from docs/agile/sprint-plan.md. PLAN mode first:
- list the exact files you'll create/modify, the registries/interfaces touched,
  the unit + e2e tests you'll add, and any spec ambiguity you want me to resolve.
- confirm it stays within Sprint <N> scope (no future-sprint features).
Then stop and wait for my approval before building.
```

After approving:

```
Approved. BUILD Sprint <N>. Commit per story (conventional commits, mention the sprint).
After building, run typecheck + lint + tests, fix failures, and give me:
  - a short summary of what changed,
  - how to try it locally,
  - anything that deviated from the spec (and update the docs accordingly).
```

---

## GUARDRAIL REMINDERS (paste if it drifts)

```
Reminder of the invariants:
- No API key in the client bundle — verify by grepping the build output.
- The AI has no host access; commands only run in the sandboxed VFS.
- New command/app/provider/theme = one small module + one registry line.
- Respect prefers-reduced-motion and the active theme in every UI change.
- Don't pull scope from later sprints. If blocked, ask rather than guess.
- Update docs/ with a dated note whenever you deviate from the spec.
```

---

## FLAGSHIP SKIN BRIEF (paste during Sprint 5)

```
Build the "claude-code" skin to match docs/design-phase/00-original-request.md and the reference screenshots:
- A rounded RED ASCII-style border box; the label "Claude Code" sits on the top-left of the border in red.
- Centered banner: "Welcome back V!" (make the name configurable), a red pixel-art mascot below it,
  then three centered lines: model ("Opus 4.7 (1M context)" style — but driven by the ACTUAL selected model),
  a plan/provider line, and the current working dir (e.g. ~/Documents/asciiart).
- Pixel/retro monospace font; mostly black background; red accent (~#E5484D).
- Prompt line starts with "> " and a solid block cursor.
- While the AI streams, show a status word (like the reference's "Honking…") and a dim "esc to interrupt" line.
- It's an original homage — brand the app as "Mirage", don't claim affiliation. The skin label may be renamed.
Make it a bespoke chrome component (themes/manifests/claude-code.tsx) but still driven by the CSS-var contract
so day/night and the shared tokens still apply.
```

---

## ONE-SHOT / NON-INTERACTIVE OPTION

If you'd rather let it run a whole sprint headless:
```
opencode run "Read AGENTS.md and docs/. Implement Sprint 0 from docs/agile/sprint-plan.md exactly, \
following all hard constraints in AGENTS.md. Commit per story. Then stop and summarize."
```
(Interactive Plan→approve→Build is safer for the big sprints; use headless for Sprint 0/1.)

---

### Why this prompt is shaped like this
- opencode reads **`AGENTS.md`** automatically and works best with **Plan→Build**; the prompt leans on both.
- Pinning the stack + invariants up front stops the agent from wandering into a different architecture mid-build.
- Sprint-at-a-time + DoD gate keeps a large project from becoming an unfinishable big-bang.
- The hard constraints repeat the only five things that, if gotten wrong, sink the project (keys, sandbox, free-tier survival, mobile, interruptible FX).
