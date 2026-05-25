import type { Command, CommandContext, OutputChunk } from '../types';

export const exportCmdCommand: Command = {
  name: 'export',
  help: 'Set environment variable. Usage: export KEY=VALUE',
  usage: 'export KEY=VALUE',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length === 0) {
      const entries = ctx.env.entries();
      for (const [key, val] of entries) {
        yield `export ${key}=${val}\n`;
      }
      return;
    }
    for (const arg of ctx.args) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        const key = arg.slice(0, eqIdx);
        const value = arg.slice(eqIdx + 1);
        ctx.env.export(key, value);
      } else {
        const val = ctx.env.get(arg);
        if (val !== undefined) {
          yield `export ${arg}=${val}\n`;
        }
      }
    }
  },
};
