import type { Command, CommandContext, OutputChunk } from '../types';

export const echoCommand: Command = {
  name: 'echo',
  help: 'Print text. Usage: echo <text...>',
  usage: 'echo [text...]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield ctx.args.join(' ') + '\n';
  },
};
