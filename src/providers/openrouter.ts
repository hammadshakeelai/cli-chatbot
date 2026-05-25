import type { Provider, ChatMsg, GenOpts, StreamDelta } from './types';
import { QuotaError, RateError, ProviderError } from './types';
import { parseSSEStream } from './sse';

const BASE = 'https://openrouter.ai/api/v1/chat/completions';

export const openrouterProvider: Provider = {
  id: 'openrouter',
  name: 'OpenRouter',
  models: ['auto:free', 'google/gemini-2.0-flash-lite-001', 'meta-llama/llama-3.3-70b-instruct'],

  async *stream(
    messages: ChatMsg[],
    opts: GenOpts,
    key?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamDelta> {
    const apiKey = key ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new ProviderError('OPENROUTER_API_KEY not configured');

    const model = opts.model ?? 'auto:free';

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

    if (response.status === 429) throw new RateError('OpenRouter rate limit');
    if (response.status === 403) throw new QuotaError('OpenRouter quota exceeded');
    if (!response.ok) throw new ProviderError(`OpenRouter returned ${response.status}`);

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
