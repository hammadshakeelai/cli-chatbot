import type { Command, CommandContext, OutputChunk } from '../types';

export const exportCommand: Command = {
  name: 'export',
  help: 'Export current session transcript. Usage: export [format]  (formats: txt, md)',
  usage: 'export [txt|md]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const format = ctx.args[0] ?? 'txt';
    const msgs = ctx.state.chatMessages ?? [];

    if (format === 'md') {
      yield '# Terminal Session\n\n';
      yield `- **Date:** ${new Date().toISOString()}\n`;
      yield `- **CWD:** \`${ctx.cwd}\`\n`;
      yield `- **Chat messages:** ${msgs.length}\n\n`;
      if (msgs.length > 0) {
        yield '## Chat\n\n';
        for (const msg of msgs) {
          yield `**${msg.role}:** ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}\n\n`;
        }
      }
    } else {
      yield `=== Terminal Session ===\n`;
      yield `Date: ${new Date().toISOString()}\n`;
      yield `CWD: ${ctx.cwd}\n`;
      if (msgs.length > 0) {
        yield `Chat messages: ${msgs.length}\n\n`;
        yield `--- Chat ---\n`;
        for (const msg of msgs) {
          yield `[${msg.role}] ${msg.content.slice(0, 300)}${msg.content.length > 300 ? '...' : ''}\n`;
        }
      }
      yield '\n=== End ===\n';
    }
  },
};
