# 07 — Deployment & Operations

## Recommended target: Vercel
- Next.js native; the `/api/chat` route handler becomes a serverless/edge function automatically.
- Free Hobby tier is ample for this; env vars hold provider keys; **Vercel KV** (or Upstash Redis) for per-IP rate limiting.
- GitHub → Vercel: push to `main` deploys prod; every PR gets a **preview deployment** (fits Agile review).
- Use **Edge runtime** for `/api/chat` if the provider SDKs are fetch-based (lower latency, good for streaming); fall back to Node runtime if an SDK needs Node APIs.

## Alternates (documented, switch via env only — NFR-8)
- **Cloudflare Pages + Workers/Pages Functions:** excellent free tier, edge streaming, **Workers KV** for rate limits. Great if Vercel limits bite.
- **Netlify:** Functions + `@netlify/blobs` or Upstash for rate limiting. (Connector available.)
- All three need only: build = `next build`, the route handler, and the env vars below.

## Environment variables (`.env.example`)
```
# server-only — never exposed to client
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
CEREBRAS_API_KEY=        # optional
MISTRAL_API_KEY=         # optional
# rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# tuning
RATE_LIMIT_PER_MIN=20
RATE_LIMIT_PER_DAY=300
MAX_OUTPUT_TOKENS=1024
# feature flags
ENABLE_TURNSTILE=false
TURNSTILE_SECRET=        # only if enabled
```

## CI/CD
- GitHub Actions: on PR → typecheck + lint + `vitest` + `playwright` (headless) + `next build`. Block merge on failure (Definition of Done gate).
- Vercel auto-deploys preview per PR and prod on merge to `main`.
- Conventional commits → optional auto-changelog.

## PWA / offline
- `manifest.json` + service worker (`next-pwa` or hand-rolled) caches the app shell, fonts, and skin assets so Mirage opens offline.
- Offline behavior: shell + apps + theming fully work; chat shows "offline — connect to use the AI." Detect via `navigator.onLine` + failed fetch.

## Observability (privacy-preserving)
- Minimal, self-hosted-friendly: log only aggregate counters (requests, fallbacks triggered, 429s) — **never chat content, never keys**.
- Optional privacy-first analytics (e.g. Plausible) behind a flag, off by default (NFR-9).
- `/api/health` returns provider availability for a status indicator.

## Runbook (common ops)
| Situation | Action |
|---|---|
| Primary (Gemini) quota hit | Fallback auto-engages; if persistent, reorder chain via env or rotate a second project key |
| Abuse / spike | Lower `RATE_LIMIT_*`; flip `ENABLE_TURNSTILE=true`; encourage BYOK in UI banner |
| New provider available | Add adapter + registry line + env var; no core change |
| Cost creep | There should be none (free tiers); if BYOK proxying adds load, it's bounded by rate limits |

## Pre-launch checklist
- [ ] No key in client bundle (grep build output).
- [ ] Rate limiting live and tested (hammer `/api/chat`).
- [ ] Fallback chain verified by forcing a 429.
- [ ] BYOK path works and isn't logged.
- [ ] Mobile pass on a real phone (the reference is mobile!).
- [ ] Reduced-motion disables FX.
- [ ] Lighthouse: PWA installable, perf/a11y green.
- [ ] CSP/CORS locked to origin.
- [ ] `.env.example` complete; README deploy steps verified on a fresh clone.
