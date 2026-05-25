# Sprint Plan

Eight ~1-week sprints (adjust to your pace). Each ends shippable. MVP is live after Sprint 6; 7–8 are polish. opencode should **Plan-mode each sprint, get the plan reviewed, then Build**, committing per story.

## Sprint 0 — Setup (½ week)
- Scaffold Next.js 15 + TS strict + Tailwind v4 + Zustand + ESLint/Prettier.
- Add xterm + addons; render an empty terminal that echoes input.
- Vitest + Playwright wired; GitHub Actions (typecheck/lint/test/build).
- `.env.example`; deploy a "hello" build to Vercel to prove the pipeline.
- **Exit:** empty terminal echoes; CI green; preview URL live.

## Sprint 1 — Shell kernel foundation
- VFS (+ IndexedDB persistence, migration hook). Env, history.
- Parser (tokenize + simple commands). Command registry + context + interrupt plumbing.
- Commands: `ls cd pwd cat echo mkdir touch rm mv cp clear whoami help man history`.
- Unit tests for VFS + parser + each command. (US-1.1–1.3, 1.6)
- **Exit:** real-feeling shell over a persistent VFS.

## Sprint 2 — Operators, completion, more commands
- Pipes `|`, `&&`/`;`, `$VAR`, redirects, glob. Tab-completion.
- `grep head tail wc env export date uname neofetch tree which cal df uptime ps`.
- (US-1.4, 1.5)
- **Exit:** `ls | grep .txt > out.txt && cat out.txt` works; tab-complete works.

## Sprint 3 — Fake apt + apps
- `apt update/search/list/install/remove` with animated install + persisted state + abort-rollback.
- Apps: figlet, neofetch, cowsay, lolcat, fortune (static-ish first).
- Animated: cmatrix, hollywood, sl, nyancat with rAF cap + interrupt + reduced-motion. (Epic 2)
- **Exit:** install→use illusion solid; animations interruptible.

## Sprint 4 — AI chatbot + server proxy
- `/api/chat` streaming route; Gemini adapter; normalized Provider interface.
- `ask`/`/chat`/fallthrough; typewriter render; status + Esc-abort.
- Fallback chain (Groq, OpenRouter) + switch notice. Per-IP rate limit + token caps. BYOK.
- `/model` + picker; persona. (Epic 3)
- **Exit:** streamed chat, survives a forced 429 via fallback, keys server-side, BYOK works.

## Sprint 5 — Theme engine + flagship skin
- CSS-var contract; `data-skin`/`data-mode`; no-FOUC inline script.
- `claude-code` skin pixel-matched to the reference (red box, banner, mascot, model/cwd, block cursor, "esc to interrupt").
- `/ui` + GUI picker; `/day` `/night` + toggle; `Ctrl+K` palette. (US-4.1–4.3, 4.6)
- **Exit:** instant skin + day/night switching; flagship looks like the screenshots.

## Sprint 6 — Tabs, persistence, mobile, deploy (MVP 🎯)
- Multi-tab sessions (isolated shell+chat, shared VFS); shortcuts; rename/reorder.
- Persist settings/VFS/history/pkgs; session export.
- Mobile-first layout + on-screen key bar; responsive chrome.
- Production deploy + rate-limit KV + preview deploys; pre-launch checklist. (Epics 5, 6)
- **Exit:** 🎯 **MVP live** — public URL, mobile-usable, multi-tab, free AI working.

## Sprint 7 — More skins + CRT FX + a11y
- 7 more skins; CRT FX layer (reduced-motion aware) + FX-off.
- A11y pass (contrast, SR mode, keyboard-only, focus rings); Lighthouse green. (US-4.4–4.5, 6.2)

## Sprint 8 — Delight & PWA
- PWA install + offline shell; sound FX (opt-in); boot animation; more ASCII/cowsay; `Ctrl+R`, `!n`; settings import/export; shareable theme codes. (Epic 7, US-6.3)

---

## Definition of Done (gate for every story)
- TypeScript compiles (strict), ESLint clean.
- Unit tests for logic modules; e2e for user-visible flows.
- Works on desktop **and** mobile viewport.
- Respects active theme + `prefers-reduced-motion`.
- No API key in the client bundle; BYOK never logged.
- Docs updated if behavior deviated from spec.
- Merged via PR with green CI + preview deploy.

## Working agreements
- Plan → review → Build, one sprint at a time; don't pull future-sprint scope.
- Conventional commits; small modules (<300 lines); registries over switches.
- Keep a `CHANGELOG`/decision notes when deviating from the spec.
