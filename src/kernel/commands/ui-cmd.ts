import type { Command, CommandContext, OutputChunk } from '../types';

export const uiCommand: Command = {
  name: 'ui',
  help: 'Change UI theme/skin. Usage: ui <skin-id> or ui list',
  usage: 'ui [skin-id|list]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const sub = ctx.args[0];

    if (!sub || sub === 'list') {
      yield 'Available skins:\n';
      // We can't access the registry from kernel directly, so use emit
      ctx.emit('__ui_list__');
      return;
    }

    // Set skin via emit
    ctx.emit(`__ui_skin__${sub}`);
    yield `Skin set to ${sub}\n`;
  },
};
