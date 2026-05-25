# 08 — Risks & Mitigations

Every foreseeable problem, solved on paper before a line of code. (The brief: "tick all boxes… problem solve all problems robustly beforehand.")

## A. Product / scope
| # | Risk | Mitigation |
|---|---|---|
| A1 | **Scope explosion** (full POSIX shell, 100 themes) | Phased sprints; incremental parser; registries; explicit non-goals. Ship MVP first. |
| A2 | Feature creep from "many other types" | Registry pattern makes additions cheap *and* deferrable; backlog parks extras. |
| A3 | Unclear named UIs (`openclaw`, `freebuff`) | Treated as registry entries; trivially renamable; not external dependencies. |

## B. AI / API (highest risk)
| # | Risk | Mitigation |
|---|---|---|
| B1 | **Free quota exhausted on a traffic spike** → app "dead" | Fallback chain (Gemini→Groq→OpenRouter) + **BYOK** valve + per-IP rate limit + pre-emptive skip of known-exhausted providers via KV counters. |
| B2 | **API key leakage** | Server proxy only; keys in env; never in client bundle (CI greps build); BYOK kept client-side, forwarded, never logged. |
| B3 | Provider API/limit changes silently | Adapters isolate vendor quirks; numbers documented as "soft, re-verify"; `/api/health` surfaces outages; chain self-heals. |
| B4 | Streaming breaks (proxy buffering) | Use platform streaming-capable runtime (Edge); set correct headers; e2e test asserts incremental chunks. |
| B5 | Abuse / cost runaway | Rate limits + token caps + optional Turnstile; free tiers mean no surprise bill anyway. |
| B6 | Prompt-injection via chat trying to "run real commands" | AI has no host access by construction; it only suggests; sandbox runs only what the user confirms. |

## C. Terminal engine
| # | Risk | Mitigation |
|---|---|---|
| C1 | Shell parser bugs (quoting/pipes) | `shell-quote` for tokenizing; heavy unit tests; incremental feature rollout. |
| C2 | Runaway animations freeze tab | rAF + FPS cap + batched writes + `AbortSignal` polling + pause when hidden + reduced-motion static fallback. |
| C3 | VFS corruption / unbounded growth | Versioned schema + migration; size caps; debounced persistence; "reset filesystem" command. |
| C4 | `apt`/install illusion feels fake or breaks | Realistic progress + dep resolution + persisted state + abort-rollback. |

## D. UI / rendering
| # | Risk | Mitigation |
|---|---|---|
| D1 | **FOUC on theme load** | Blocking inline script sets `data-skin`/`data-mode` pre-hydration. |
| D2 | xterm ↔ React lifecycle leaks | xterm instances in refs outside render; created/disposed in effects; ResizeObserver + FitAddon; kept alive across tab switch. |
| D3 | Theme switch slow/janky | CSS-variable swap (no re-render of tree); xterm theme set imperatively; target <100ms. |
| D4 | CRT FX hurts perf / accessibility | CSS-only where possible; heavy FX opt-in; disabled under reduced-motion; global FX-off. |

## E. Platform / device
| # | Risk | Mitigation |
|---|---|---|
| E1 | **Mobile unusable** (reference IS mobile) | Mobile-first; custom input feeding xterm; on-screen key bar (Esc/Ctrl/Tab/arrows/`|`/`/`); pinch-zoom; test on real device. |
| E2 | Many tabs eat memory | Tab cap (~10); scrollback cap; dispose/pause hidden heavy work; lazy-create xterm. |
| E3 | iOS Safari quirks (vh, keyboard, audio) | Use dvh units; visualViewport API for keyboard; audio only on user gesture (opt-in). |
| E4 | Offline expectation | PWA caches shell; chat degrades gracefully with clear messaging. |

## F. Process / delivery
| # | Risk | Mitigation |
|---|---|---|
| F1 | Big-bang build that never finishes | Agile sprints with shippable increments; MVP usable after Sprint 3. |
| F2 | Agent (opencode) drifts from spec | `AGENTS.md` + spec docs + Plan-mode review per sprint + DoD gate in CI. |
| F3 | Docs rot as code changes | "Update docs on deviation" convention; dated decision notes. |

## G. Legal / content
| # | Risk | Mitigation |
|---|---|---|
| G1 | Trademark/name overlap (Claude Code skin, names) | `claude-code` skin is *inspired-by* homage; ship under a clear original brand (Mirage); don't claim affiliation; rename skin label if needed. |
| G2 | AI generates harmful content | Lean on provider safety + a light system-prompt guardrail; it's a toy, not a moderation platform. |
| G3 | User-entered keys mishandled | Explicit privacy copy; client-only storage; never logged. |

## Top-5 to never get wrong
1. **Keys never reach the client.** (B2)
2. **Free tier survives a spike** via fallback + BYOK + rate limit. (B1/B5)
3. **Mobile actually works.** (E1)
4. **Animations can always be interrupted and respect reduced-motion.** (C2/D4)
5. **The AI has zero real system access.** (B6)
