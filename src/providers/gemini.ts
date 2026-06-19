import type { Provider, ChatMsg, GenOpts, StreamDelta } from './types';
import { QuotaError, RateError, ProviderError } from './types';
import { parseSSEStream } from './sse';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const geminiProvider: Provider = {
  id: 'gemini',
  name: 'Google Gemini',
  models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'],

  async *stream(
    messages: ChatMsg[],
    opts: GenOpts,
    key?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamDelta> {
    const apiKey = key ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new ProviderError('GEMINI_API_KEY not configured');

    const model = opts.model ?? 'gemini-2.0-flash';
    const url = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const systemPrompt = opts.systemPrompt;
    const contents = messages.filter((m) => m.role !== 'system');
    const systemInstruction = systemPrompt
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : {};

    const body = {
      ...systemInstruction,
      contents: contents.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.7,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (response.status === 429) throw new RateError('Gemini rate limit');
    if (response.status === 403) throw new QuotaError('Gemini quota exceeded');
    if (!response.ok) throw new ProviderError(`Gemini returned ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError('No response body');

    for await (const raw of parseSSEStream(reader, signal ?? new AbortController().signal)) {
      try {
        const parsed = JSON.parse(raw);
        const candidates = parsed.candidates;
        if (!candidates?.length) continue;
        const text = candidates[0]?.content?.parts?.[0]?.text;
        if (text) {
          yield { type: 'delta', text };
        }
      } catch {
        // skip malformed chunks
      }
    }

    yield { type: 'done' };
  },
};
