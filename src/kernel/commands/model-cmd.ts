import type { Command, CommandContext, OutputChunk } from '../types';

const MODEL_PRESETS: Record<string, string> = {
  'opus-4.7': 'gemini:gemini-2.0-flash',
  'claude-code-opus-4.8': 'groq:llama-3.3-70b-versatile',
  'sonnet-4.7': 'openrouter:auto:free',
  'haiku-4.7': 'gemini:gemini-2.0-flash',
  'kiros-4.8': 'openrouter:auto:free',
};

export const modelCommand: Command = {
  name: 'model',
  help: 'Set AI model or view current. Usage: model [provider:model] [persona] [preset]',
  usage: 'model [provider:model] [persona <text>] [list] [presets]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const sub = ctx.args[0];

    if (!sub) {
      yield `Current model: ${ctx.chatModel ?? 'gemini-2.0-flash'}\n`;
      yield `Persona: ${ctx.chatPersona ?? 'default'}\n`;
      yield 'Available: gemini:gemini-2.0-flash, groq:llama-3.3-70b-versatile, openrouter:auto:free\n';
      yield 'Usage: model groq:llama-3.3-70b-versatile\n';
      yield 'Usage: model persona <text>  — set custom AI personality\n';
      yield 'Usage: model presets  — list model presets\n';
      return;
    }

    if (sub === 'persona') {
      const personaText = ctx.args.slice(1).join(' ');
      if (!personaText) {
        yield 'Usage: model persona <text>\n';
        return;
      }
      ctx.state.chatPersona = personaText;
      yield `Persona updated.\n`;
      return;
    }

    if (sub === 'presets') {
      yield 'Model presets:\n';
      for (const [name, mapping] of Object.entries(MODEL_PRESETS)) {
        yield `  ${name}  →  ${mapping}\n`;
      }
      yield '\nUsage: model <preset-name>\n';
      return;
    }

    if (sub === 'list') {
      yield 'Available models:\n';
      try {
        const res = await fetch('/api/models');
        const data = await res.json() as { models: { id: string; models: string[] }[] };
        for (const provider of data.models) {
          for (const model of provider.models) {
            yield `  ${provider.id}:${model}\n`;
          }
        }
      } catch {
        yield '  gemini:gemini-2.0-flash\n';
        yield '  groq:llama-3.3-70b-versatile\n';
        yield '  openrouter:auto:free\n';
      }
      yield '\nModel presets:\n';
      for (const [name, mapping] of Object.entries(MODEL_PRESETS)) {
        yield `  ${name}  →  ${mapping}\n`;
      }
      return;
    }

    // Check if it's a preset name
    if (MODEL_PRESETS[sub]) {
      ctx.state.chatModel = MODEL_PRESETS[sub]!;
      yield `Model set to ${sub} (${MODEL_PRESETS[sub]})\n`;
      return;
    }

    // Set model
    if (sub.includes(':')) {
      ctx.state.chatModel = sub;
      yield `Model set to ${sub}\n`;
    } else {
      yield `Unknown option: ${sub}\n`;
      yield 'Try: model presets, model list, model persona <text>, or model <provider:model>\n';
    }
  },
};
