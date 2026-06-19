import type { Provider, ChatMsg, GenOpts, StreamDelta, MetaDelta } from './types';
import { geminiProvider } from './gemini';
import { groqProvider } from './groq';
import { openrouterProvider } from './openrouter';
import { grokProvider } from './grok';

const ALL_PROVIDERS: Provider[] = [geminiProvider, groqProvider, openrouterProvider, grokProvider];
const DEFAULT_CHAIN = ['gemini', 'groq', 'xai', 'openrouter'];

export function getProvider(id: string): Provider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getModels(): { id: string; models: string[] }[] {
  return ALL_PROVIDERS.map((p) => ({ id: p.id, models: p.models }));
}

export async function* routeStream(
  messages: ChatMsg[],
  opts: GenOpts,
  byokKey?: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamDelta> {
  // A provider prefix (e.g. "groq:llama-3.3-70b") is a *preference*: that
  // provider is tried first with the requested model, then the remaining
  // providers are tried with their own default models — so one dead key or
  // rate-limited provider never takes the whole app down.
  let chain: string[] = DEFAULT_CHAIN;
  let preferred: string | undefined;
  let modelOverride: string | undefined;

  if (opts.model?.includes(':')) {
    const [providerId, ...rest] = opts.model.split(':');
    preferred = providerId!;
    modelOverride = rest.join(':');
    chain = [preferred, ...DEFAULT_CHAIN.filter((p) => p !== preferred)];
  }

  let lastError: string | undefined;
  let attempts = 0;

  for (const providerId of chain) {
    const provider = getProvider(providerId);
    if (!provider) {
      lastError = `Unknown provider: ${providerId}`;
      continue;
    }

    // The override model only applies to the preferred provider; everyone
    // else uses their own first-choice model.
    const model = providerId === preferred && modelOverride
      ? modelOverride
      : (!opts.model || opts.model.includes(':') ? provider.models[0] : opts.model);

    if (!provider.models.length) {
      lastError = `${providerId} has no available models`;
      continue;
    }

    try {
      const adjustedOpts = { ...opts, model };
      yield { type: 'meta', key: 'provider', value: provider.name } as MetaDelta;
      yield { type: 'meta', key: 'model', value: model } as MetaDelta;

      if (attempts > 0) {
        yield {
          type: 'meta',
          key: 'switchedTo',
          value: `${provider.name} (${model})`,
        } as MetaDelta;
      }
      attempts++;

      for await (const delta of provider.stream(messages, adjustedOpts, byokKey, signal)) {
        yield delta;
        if (delta.type === 'done' || delta.type === 'error') return;
      }
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `${provider.name}: ${msg}`;
      // Try next provider
      continue;
    }
  }

  // All providers exhausted
  yield {
    type: 'error',
    code: 'ALL_EXHAUSTED',
    message: lastError
      ? `All providers unavailable. Last error: ${lastError}`
      : 'All AI providers are currently unavailable. Try again later or configure a BYOK.',
  };
}
