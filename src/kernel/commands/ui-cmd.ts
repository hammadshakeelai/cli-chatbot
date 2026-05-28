import type { Command, CommandContext, OutputChunk } from '../types';
import { ALL_SKIN_META } from '@/themes/skin-meta';

export const uiCommand: Command = {
  name: 'ui',
  help: 'Change UI theme/skin. Usage: ui <skin-id> or ui list',
  usage: 'ui [skin-id|list]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const sub = ctx.args[0];

    if (!sub || sub === 'list') {
      yield 'Available skins:\n';
      for (const meta of ALL_SKIN_META) {
        const marker = meta.id === ctx.ui.skin ? ' ◉' : '  ';
        yield `${marker} \x1b[1m${meta.id}\x1b[0m — ${meta.description}\n`;
      }
      yield `\nUse: ui <skin-id> to switch.\n`;
      return;
    }

    // Validate skin ID
    const skinMeta = ALL_SKIN_META.find((m) => m.id === sub);
    if (!skinMeta) {
      yield `ui: unknown skin '${sub}'\n`;
      yield `Run 'ui list' to see available skins.\n`;
      return;
    }

    // Set skin via emit
    ctx.emit(`__ui_skin__${sub}`);
    yield `Skin set to ${skinMeta.label} (${sub})\n`;
  },
};
