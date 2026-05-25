import type { Command, CommandContext, OutputChunk } from '../types';
import { helpCommand } from './help';

export const manCommand: Command = {
  name: 'man',
  help: 'Show manual for a command. Usage: man <command>',
  usage: 'man <command>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield* helpCommand.run(ctx);
  },
};
