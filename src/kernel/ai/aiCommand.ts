import type { Command, CommandContext, OutputChunk } from '../types';
import type { ChatMsg } from '@/providers/types';

const DEFAULT_PERSONA =
  'You are Mirage, a warm, witty retro-terminal AI companion. ' +
  'Keep replies terminal-friendly. You may output ANSI escape codes and ASCII art. ' +
  'You may suggest shell commands and explain them. ' +
  'You have no real system access — the sandbox runs commands the user chooses. ' +
  'Be concise but friendly.';

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export const aiCommand: Command = {
  name: 'ai',
  help: 'Chat with the AI assistant. Usage: ai <message>',
  usage: 'ai <message>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const message = ctx.args.join(' ');
    if (!message) {
      yield 'Usage: ai <message>\n';
      return;
    }

    const chatMessages = ctx.state.chatMessages ?? [];
    const model = ctx.chatModel ?? 'gemini-2.0-flash';
    const persona = ctx.chatPersona ?? DEFAULT_PERSONA;
    const byokKey = ctx.byokKey;

    // Add user message
    const userMsg: ChatMsg = { role: 'user', content: message };

    // Build messages array
    const systemMsg: ChatMsg = { role: 'system', content: persona };
    const messagesToSend = [systemMsg, ...chatMessages, userMsg];

    // Show streaming status — per reference: "Honking…" in yellow/red
    yield `\x1b[1;33mHonking…\x1b[0m`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          model,
          persona,
          key: byokKey,
        }),
        signal: ctx.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        yield `\r\x1b[31mError: ${err.message ?? 'Unknown error'}\x1b[0m\n`;
        return;
      }

      // Clear spinner, start response
      yield '\r  \r'; // clear "Thinking"

      const reader = response.body?.getReader();
      if (!reader) {
        yield '\x1b[31mNo response stream\x1b[0m\n';
        return;
      }

      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = '';
      let providerName = '';
      let modelName = '';
      let switchedTo = '';

      while (true) {
        if (ctx.signal.aborted) {
          reader.cancel().catch(() => {});
          yield '\n\x1b[2mInterrupted.\x1b[0m\n';
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (!data) continue;

          try {
            const delta = JSON.parse(data);

            switch (delta.type) {
              case 'delta':
                assistantText += delta.text;
                yield delta.text;
                await sleep(8, ctx.signal); // typewriter feel
                break;
              case 'meta':
                if (delta.key === 'provider') providerName = delta.value;
                if (delta.key === 'model') modelName = delta.value;
                if (delta.key === 'switchedTo') switchedTo = delta.value;
                break;
              case 'error':
                yield `\n\x1b[31m${delta.message}\x1b[0m\n`;
                break;
              case 'done':
                break;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      // Show model info footer
      if (assistantText) {
        yield '\n';
        if (switchedTo) {
          yield `\x1b[2m${switchedTo}\x1b[0m\n`;
        } else if (providerName && modelName) {
          yield `\x1b[2mvia ${providerName} (${modelName})\x1b[0m\n`;
        }
      }

      // Store conversation in mutable state
      ctx.state.chatMessages = [...chatMessages, userMsg, { role: 'assistant' as const, content: assistantText }];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      yield `\r\x1b[31mRequest failed: ${msg}\x1b[0m\n`;
    }
  },
};
