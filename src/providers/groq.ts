import type { Provider, ChatMsg, GenOpts, StreamDelta } from './types';
import { QuotaError, RateError, ProviderError } from './types';
import { parseSSEStream } from './sse';

const BASE = 'https://api.groq.com/openai/v1/chat/completions';

export const groqProvider: Provider = {
  id: 'groq',
  name: 'Groq',
  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],

  async *stream(
    messages: ChatMsg[],
    opts: GenOpts,
    key?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamDelta> {
    const apiKey = key ?? process.env.GROQ_API_KEY;
    if (!apiKey) throw new ProviderError('GROQ_API_KEY not configured');

    const model = opts.model ?? 'llama-3.3-70b-versatile';

    const body = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      stream: true,
    };

    const response = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (response.status === 429) throw new RateError('Groq rate limit');
    if (response.status === 403) throw new QuotaError('Groq quota exceeded');
    if (!response.ok) throw new ProviderError(`Groq returned ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError('No response body');

    for await (const raw of parseSSEStream(reader, signal ?? new AbortController().signal)) {
      try {
        const parsed = JSON.parse(raw);
        const choice = parsed.choices?.[0];
        if (choice?.finish_reason === 'stop') break;
        const text = choice?.delta?.content;
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
