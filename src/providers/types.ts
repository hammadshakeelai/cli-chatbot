export interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenOpts {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface TokenDelta {
  type: 'delta';
  text: string;
}

export interface MetaDelta {
  type: 'meta';
  key: string;
  value: string;
}

export interface ErrorDelta {
  type: 'error';
  code: string;
  message: string;
}

export interface DoneDelta {
  type: 'done';
}

export type StreamDelta = TokenDelta | MetaDelta | ErrorDelta | DoneDelta;

export class QuotaError extends Error {
  code = 'QUOTA_EXCEEDED';
  constructor(msg = 'Quota exceeded') { super(msg); }
}

export class RateError extends Error {
  code = 'RATE_LIMITED';
  constructor(msg = 'Rate limited') { super(msg); }
}

export class ProviderError extends Error {
  code = 'PROVIDER_ERROR';
  constructor(msg: string) { super(msg); }
}

export interface Provider {
  id: string;
  name: string;
  models: string[];
  stream(
    messages: ChatMsg[],
    opts: GenOpts,
    key?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamDelta>;
}
