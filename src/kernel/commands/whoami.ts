import type { Command, CommandContext, OutputChunk } from '../types';

export const whoamiCommand: Command = {
  name: 'whoami',
  help: 'Print current user name.',
  usage: 'whoami',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield (ctx.env.get('USER') || 'user') + '\n';
  },
};
