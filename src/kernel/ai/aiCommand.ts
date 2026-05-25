import type { Command, CommandContext, OutputChunk } from '../types';

export const aiCommand: Command = {
  name: 'ai',
  help: 'AI chat mode (not yet available).',
  usage: 'ai <message>',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield 'AI chat will be available in Sprint 4.\n';
  },
};
