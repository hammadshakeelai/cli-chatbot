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
  // If model specifies a provider prefix (e.g. "groq:llama-3.3-70b"), use that
  let chain: string[];
  let modelOverride: string | undefined;

  if (opts.model?.includes(':')) {
    const [providerId, ...rest] = opts.model.split(':');
    const modelName = rest.join(':');
    chain = [providerId!];
    modelOverride = modelName;
  } else if (byokKey) {
    // BYOK with default model: try all providers with the custom key, start with gemini
    chain = DEFAULT_CHAIN;
  } else {
    chain = DEFAULT_CHAIN;
  }

  let lastError: string | undefined;

  for (const providerId of chain) {
    const provider = getProvider(providerId);
    if (!provider) {
      lastError = `Unknown provider: ${providerId}`;
      continue;
    }

    const model = modelOverride ?? opts.model ?? provider.models[0];

    // If provider has no models configured, skip
    if (!provider.models.length) {
      lastError = `${providerId} has no available models`;
      continue;
    }

    try {
      const adjustedOpts = { ...opts, model };
      yield { type: 'meta', key: 'provider', value: provider.name } as MetaDelta;
      yield { type: 'meta', key: 'model', value: model } as MetaDelta;

      if (chain.indexOf(providerId) > 0) {
        yield {
          type: 'meta',
          key: 'switchedTo',
          value: `${provider.name} (${model})`,
        } as MetaDelta;
      }

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
