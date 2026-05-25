import type { Command, CommandContext, OutputChunk } from '../types';

export const clearCommand: Command = {
  name: 'clear',
  help: 'Clear the terminal screen.',
  usage: 'clear',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield '\x1b[2J\x1b[3J\x1b[H';
  },
};
