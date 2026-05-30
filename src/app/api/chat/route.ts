import { NextRequest } from 'next/server';
import { routeStream } from '@/providers/router';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { ChatMsg } from '@/providers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Maximum messages to keep in context (prevents huge payloads)
const MAX_CONTEXT_MESSAGES = 40;
const MAX_MESSAGE_CHARS    = 8000;

const DEFAULT_PERSONA =
  'You are Mirage, a warm, witty terminal AI. Keep replies concise and terminal-friendly. ' +
  'You may use ANSI escape codes. Be helpful and direct.';

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    const retryAfter = Math.ceil(rateCheck.resetIn / 1000);
    return new Response(
      JSON.stringify({
        error:      'Rate limit exceeded',
        message:    `Too many requests. Try again in ${retryAfter}s.`,
        retryAfter,
      }),
      {
        status:  429,
        headers: {
          'Content-Type':  'application/json',
          'Retry-After':   String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Date.now() + rateCheck.resetIn),
        },
      },
    );
  }

  // ── Parse + validate body ───────────────────────────────────────────────────
  let body: { messages?: ChatMsg[]; model?: string; persona?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonError('Request body must be a JSON object', 400);
  }

  // Validate and sanitize messages
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMsg[] = rawMessages
    .filter((m): m is ChatMsg =>
      m && typeof m === 'object' &&
      typeof m.content === 'string' &&
      ['user', 'assistant', 'system'].includes(m.role)
    )
    .map((m) => ({
      role:    m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }))
    .slice(-MAX_CONTEXT_MESSAGES);

  if (messages.length === 0) {
    return jsonError('messages array is empty or invalid', 400);
  }

  const model      = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gemini-2.0-flash';
  const persona    = typeof body.persona === 'string' && body.persona.trim() ? body.persona.trim() : DEFAULT_PERSONA;
  const byokKey    = typeof body.key === 'string' && body.key.trim() ? body.key.trim() : undefined;

  // ── Stream response ─────────────────────────────────────────────────────────
  const abortController = new AbortController();

  // Abort on client disconnect
  req.signal.addEventListener('abort', () => abortController.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        for await (const delta of routeStream(
          messages,
          { model, systemPrompt: persona },
          byokKey,
          abortController.signal,
        )) {
          enqueue(delta);

          // Stop streaming after done/error
          if (delta.type === 'done' || delta.type === 'error') break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Don't surface abort errors to client
        if (!(err instanceof Error && err.name === 'AbortError')) {
          enqueue({ type: 'error', code: 'STREAM_ERROR', message: msg });
        }
      } finally {
        enqueue({ type: 'done' });
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache, no-transform',
      'Connection':                  'keep-alive',
      'X-Accel-Buffering':           'no',   // disable nginx buffering
      'X-RateLimit-Remaining':       String(rateCheck.remaining),
    },
  });
}
