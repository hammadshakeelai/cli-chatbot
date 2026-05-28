import { describe, it, expect } from 'vitest';
import { parseSSEStream } from '@/providers/sse';

function makeReader(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder();
  let idx = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(encoder.encode(chunks[idx]!));
        idx++;
      } else {
        controller.close();
      }
    },
  });
  return stream.getReader();
}

async function collect(chunks: string[], signal = new AbortController().signal): Promise<string[]> {
  const reader = makeReader(chunks);
  const gen = parseSSEStream(reader, signal);
  const results: string[] = [];
  for await (const item of gen) results.push(item);
  return results;
}

describe('SSE stream parser', () => {
  it('parses a single data line', async () => {
    const result = await collect(['data: hello\n\n']);
    expect(result).toEqual(['hello']);
  });

  it('parses multiple data lines', async () => {
    const result = await collect(['data: hello\n', 'data: world\n\n']);
    expect(result).toEqual(['hello', 'world']);
  });

  it('strips data: prefix', async () => {
    const result = await collect(['data: {"text":"hi"}\n\n']);
    expect(result).toEqual(['{"text":"hi"}']);
  });

  it('handles [DONE] signal', async () => {
    const result = await collect(['data: token1\n', 'data: [DONE]\n', 'data: token2\n']);
    expect(result).toEqual(['token1']);
  });

  it('handles chunks split across reads', async () => {
    const result = await collect(['data: hel', 'lo\n\n']);
    expect(result).toEqual(['hello']);
  });

  it('ignores non-data lines', async () => {
    const result = await collect([':comment\n', 'data: hello\n', '\n']);
    expect(result).toEqual(['hello']);
  });

  it('cancels reader on abort', async () => {
    const ac = new AbortController();
    ac.abort();
    const result = await collect(['data: hello\n\n'], ac.signal);
    expect(result).toEqual([]);
  });

  it('handles empty stream', async () => {
    const result = await collect([]);
    expect(result).toEqual([]);
  });
});
