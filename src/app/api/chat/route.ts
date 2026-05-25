import { NextRequest } from 'next/server';
import { routeStream } from '@/providers/router';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { ChatMsg } from '@/providers/types';

export const runtime = 'nodejs';

const FALLBACK_SYSTEM_PROMPT =
  'You are Mirage, a warm, witty retro-terminal AI companion. ' +
  'Keep replies terminal-friendly. You may output ANSI escape codes and ASCII art. ' +
  'You may suggest shell commands and explain them. ' +
  'You have no real system access — the sandbox runs commands the user chooses. ' +
  'Be concise but friendly.';

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limited',
        message: `Too many requests. Try again in ${Math.ceil(rateCheck.resetIn / 1000)}s.`,
        retryAfter: Math.ceil(rateCheck.resetIn / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)),
        },
      },
    );
  }

  // Parse body
  let body: { messages?: ChatMsg[]; model?: string; persona?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = body.messages ?? [];
  const model = body.model ?? 'gemini-2.0-flash';
  const persona = body.persona ?? FALLBACK_SYSTEM_PROMPT;
  const byokKey = body.key; // user-supplied key, passed through header

  // Build system prompt
  const systemPrompt = persona;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const delta of routeStream(messages, { model, systemPrompt }, byokKey)) {
          const json = JSON.stringify(delta);
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const errorJson = JSON.stringify({ type: 'error', code: 'STREAM_ERROR', message: msg });
        controller.enqueue(encoder.encode(`data: ${errorJson}\n\n`));
      } finally {
        controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
