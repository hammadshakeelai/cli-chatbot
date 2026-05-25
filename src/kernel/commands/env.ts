import type { Command, CommandContext, OutputChunk } from '../types';

export const envCommand: Command = {
  name: 'env',
  help: 'Print environment variables.',
  usage: 'env',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const entries = ctx.env.entries();
    for (const [key, val] of entries) {
      yield `${key}=${val}\n`;
    }
  },
};
