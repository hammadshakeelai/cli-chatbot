import type { Command, CommandContext, OutputChunk } from '../types';

export const tailCommand: Command = {
  name: 'tail',
  help: 'Output the last part of files. Usage: tail [-n N] [file]',
  usage: 'tail [-n N] [file]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const numLines = typeof ctx.flags['n'] === 'string' ? parseInt(ctx.flags['n'] as string, 10) : 10;

    let lines: string[];
    if (ctx.args.length >= 1) {
      const content = ctx.vfs.read(ctx.args[0]!, ctx.cwd);
      if (content === undefined) {
        yield `tail: ${ctx.args[0]}: No such file or directory\n`;
        return;
      }
      lines = content.split('\n');
    } else if (ctx.stdin) {
      const chunks: string[] = [];
      for await (const chunk of ctx.stdin) chunks.push(chunk);
      lines = chunks.join('').split('\n');
    } else {
      return;
    }

    const start = Math.max(0, lines.length - numLines);
    yield lines.slice(start).join('\n') + '\n';
  },
};
