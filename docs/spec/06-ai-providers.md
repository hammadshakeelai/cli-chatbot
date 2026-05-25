# 06 — AI Providers & Chat

The deployment-critical subsystem. Free, streamed, abuse-resistant.

## Free providers (verified May 2026 — re-confirm at each provider's docs before launch)
| Provider | Free ceiling (approx) | Best model (free) | Role |
|---|---|---|---|
| **Google AI Studio (Gemini)** | ~1,500 req/day, ~10–15 RPM, 1M ctx, no card | Gemini 2.5 Flash | **Primary** (quality + context) |
| **Groq** | ~30 RPM, 6K TPM, no card | Llama 3.3 70B | **Speed / first fallback** (very fast streaming) |
| **OpenRouter** | ~30 free models, ~20 RPM, ~200/day each | `auto:free` (routes to best free) | **Variety / second fallback** |
| **Cerebras** | ~1M tokens/day | Llama 3.3 70B | optional high-throughput fallback |
| **Mistral** | ~1B tokens/month | Mistral/Codestral | optional |
| **BYOK / Ollama** | user-supplied / local | any | pressure valve for heavy users |

> ⚠️ Free RPM/quotas were cut by several providers in late 2025. Treat all numbers as *soft*; design must not assume any single tier is enough.

## Normalized interface (server-side)
```ts
interface Provider {
  id: string;
  models: ModelInfo[];
  stream(messages: ChatMsg[], opts: GenOpts, key?: string): AsyncIterable<TokenDelta>;
  // MUST throw QuotaError | RateError | ProviderError so the router can react
}
```
Each adapter (`gemini.ts`, `groq.ts`, `openrouter.ts`, …) translates the normalized request to that vendor's API and normalizes the streaming response back to `TokenDelta`s. All three above are OpenAI-compatible or close, so a thin shared SSE parser covers most of them.

## Router & fallback chain
`providers/router.ts`:
1. If the request specifies a model/provider (or BYOK), try it first.
2. Else use the **chain**: `[gemini, groq, openrouter:auto]`.
3. On `QuotaError`/`RateError`/5xx → advance to next provider, emit a `meta:{switchedTo}` stream event so the UI can say *"Gemini busy — switched to Groq."*
4. If all exhausted → emit a friendly terminal message suggesting BYOK or retry later. Never a raw 500 to the user.
5. Track per-provider request counts in KV with a daily reset to pre-empt known-exhausted providers (skip ahead instead of failing first).

## Streaming
- Server route returns `text/event-stream`. Events: `delta` (token text), `meta` (model switch / usage), `done`, `error`.
- Client uses `fetch` + `ReadableStream` reader (not `EventSource`, so we can send POST + headers + abort). `AbortController` wired to Esc/Ctrl-C.
- Tokens written to xterm with a small typewriter delay for the "live generation" feel (the reference's `Honking…`). A status line shows the active model + spinner; `esc to interrupt` hint visible.

## BYOK (bring your own key)
- Settings → per-provider key field. Stored in `localStorage` (client-only), optionally obfuscated, never sent anywhere except the proxy as a request header.
- Server uses the supplied key for that request, **never logs it**, never persists it. A header flag marks BYOK so server skips its own quota counting.
- Clear UI copy: "Your key stays in your browser; it's used only to make your requests and is never stored on our servers."

## Server-side safety & cost control (for public deploy)
- **Per-IP rate limit** via Upstash Redis / platform KV: e.g. 20 req/min, 300 req/day (tune). Returns a friendly 429 the UI renders inline.
- **Caps:** max input tokens, max output tokens, max conversation length forwarded.
- **Turnstile/hCaptcha** gate that activates only under abuse (feature-flagged).
- **No secrets in client bundle**; keys via host env (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, …). `.env.example` documents them.
- **CORS/CSP** locked to own origin; proxy validates payload shape.

## System prompt (persona)
A configurable base prompt: a warm, witty retro-terminal companion ("feel-good"). It:
- Keeps replies terminal-friendly (can output ANSI/ASCII art, code blocks render in xterm).
- May *suggest* shell commands and explain them, and can note "run `apt install figlet` then `figlet hi`".
- Is explicitly told it has **no real system access** — it cannot execute on the host; the sandbox runs commands the user chooses.
- Tone/persona editable in Settings (`/persona`), with a couple of presets (helpful, sassy, zen).

## Per-tab model selection
Each tab's chat slice stores its chosen model; `/model <id>` and the GUI picker set it. Default = primary chain. Switching models mid-conversation is allowed (history is provider-agnostic `ChatMsg[]`).
