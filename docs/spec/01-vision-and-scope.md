# 01 — Vision & Scope

## Vision
A **feel-good virtual terminal** that anyone can open in a browser and immediately mess around in — type `ls`, run `cmatrix`, `apt install` a toy, swap the whole look to a glowing amber CRT, and chat with an AI — all free, all safe, all in one tab-able window. It should spark the same joy as discovering `sl` or `cowsay` for the first time, wrapped in a beautiful, swappable retro UI.

## Problem it solves
- Real terminals are intimidating and risky for newcomers; cloud sandboxes are heavy and cost money.
- AI chat UIs are bland and identical.
- There's no playful, customizable, zero-setup place to *feel* like a hacker and talk to an AI at the same time.

Mirage is a **safe playground**: the power-user aesthetic and the fun CLI toys, minus the danger and the setup, plus a personality.

## Target users
- Students / curious beginners wanting a no-risk terminal to learn the *feel* of CLI.
- Devs who want a pretty scratch terminal + quick AI access in a browser tab.
- Tinkerers who love ricing terminals (themes, CRT FX, ASCII art).

## Goals (what success looks like)
- Loads in <2s, usable on a phone.
- A first-timer runs 3 commands and switches a theme within 60 seconds without instructions.
- Chat responds (streamed) on the free tier without the operator paying anything, and survives a traffic spike via BYOK + fallback.
- Adding a new theme or command is a single small file.

## In scope (v1)
- Simulated shell: VFS, ~30 core commands, pipes/redirects/`&&`, history, tab-completion.
- Fake `apt` + ~10 bundled "apps" (figlet, cmatrix, hollywood, cowsay, lolcat, sl, neofetch, nyancat, toilet, fortune).
- AI chatbot: streamed, multi-provider with fallback + BYOK, `/chat` mode + `ask` command + natural-language fallthrough.
- ≥8 UI skins, runtime switch via `/ui` + GUI, day/night, CRT FX (reduced-motion aware).
- Multi-tab sessions (shared VFS, isolated shell/chat).
- Persistence (settings, VFS, history, installed pkgs).
- Deploy to a free host with server-side keys + IP rate limiting.
- Mobile-first responsive + a11y baseline.

## Out of scope (v1 — parked for later)
- Real OS / WASM Linux (v86/WebVM). *Mirage is a simulation by design.*
- User accounts, auth, cloud sync of sessions.
- Collaborative / shared sessions.
- Voice, image generation, file uploads to the AI.
- A real plugin marketplace (the registry is internal-only in v1).

## Guiding principles
1. **Illusion over implementation** — it only has to *feel* real and be delightful.
2. **Safe by construction** — nothing touches a real system; keys never reach the client.
3. **Everything is a plugin** — commands, apps, providers, themes are registry entries.
4. **Free to run, free to use** — design around real free-tier limits.
5. **Joy is a feature** — animations, sounds (opt-in), ASCII art, personality.
