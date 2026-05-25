import type { Command, CommandContext, OutputChunk } from '../types';

export const whichCommand: Command = {
  name: 'which',
  help: 'Locate a command. Usage: which <command>',
  usage: 'which <command>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length === 0) {
      yield 'which: missing argument\n';
      return;
    }
    for (const arg of ctx.args) {
      const cmd = ctx.registry?.get(arg);
      if (cmd) {
        yield `/bin/${arg}\n`;
      } else {
        yield `${arg} not found\n`;
      }
    }
  },
};
