import type { Command, CommandContext, OutputChunk } from '../types';

export const fxCommand: Command = {
  name: 'fx',
  help: 'Toggle CRT visual effects. Usage: fx [on|off]',
  usage: 'fx [on|off]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const sub = ctx.args[0];
    if (sub === 'on' || sub === 'off') {
      ctx.emit(`__fx__${sub}`);
      yield `CRT FX ${sub === 'on' ? 'enabled' : 'disabled'}.\n`;
    } else {
      yield 'Usage: fx on|off\n';
    }
  },
};
