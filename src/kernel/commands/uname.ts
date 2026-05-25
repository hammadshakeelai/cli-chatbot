import type { Command, CommandContext, OutputChunk } from '../types';

export const unameCommand: Command = {
  name: 'uname',
  help: 'Print system information. Usage: uname [-a]',
  usage: 'uname [-a]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const all = ctx.flags['a'] === true;
    const kernel = 'Mirage';
    const hostname = 'mirage';
    const release = '0.1.0';
    const arch = 'wasm';

    if (all) {
      yield `${kernel} ${hostname} ${release} ${arch} GNU/Linux\n`;
    } else {
      yield `${kernel}\n`;
    }
  },
};
