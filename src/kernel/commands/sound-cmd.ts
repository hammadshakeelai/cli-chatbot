import type { Command } from '@/kernel/types';

export const soundCommand: Command = {
  name: 'sound',
  help: 'Toggle keyboard click sounds',
  usage: 'sound on | sound off',
  async *run(ctx) {
    const sub = ctx.args[0];
    if (sub === 'on') {
      ctx.state.soundFx = true;
      yield 'Sound FX enabled.\n';
    } else if (sub === 'off') {
      ctx.state.soundFx = false;
      yield 'Sound FX disabled.\n';
    } else {
      yield `Sound FX: ${ctx.state.soundFx ? 'on' : 'off'}\n`;
      yield `Usage: sound on | sound off\n`;
    }
  },
};
