import type { Command, CommandContext, OutputChunk } from '../types';

export const dateCommand: Command = {
  name: 'date',
  help: 'Print the current date and time.',
  usage: 'date',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    const now = new Date();
    yield now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }) + '\n';
  },
};
