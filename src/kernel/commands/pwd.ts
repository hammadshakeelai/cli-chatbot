import type { Command, CommandContext, OutputChunk } from '../types';

export const pwdCommand: Command = {
  name: 'pwd',
  help: 'Print working directory.',
  usage: 'pwd',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield ctx.cwd + '\n';
  },
};
