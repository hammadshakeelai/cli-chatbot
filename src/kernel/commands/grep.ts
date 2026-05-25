import type { Command, CommandContext, OutputChunk } from '../types';

export const grepCommand: Command = {
  name: 'grep',
  help: 'Search for patterns in text. Usage: grep <pattern> [file]',
  usage: 'grep <pattern> [file]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length === 0) {
      yield 'grep: missing pattern\n';
      return;
    }
    const pattern = ctx.args[0]!;
    const ignoreCase = ctx.flags['i'] === true;

    let lines: string[];
    if (ctx.args.length >= 2) {
      const content = ctx.vfs.read(ctx.args[1]!, ctx.cwd);
      if (content === undefined) {
        yield `grep: ${ctx.args[1]}: No such file or directory\n`;
        return;
      }
      lines = content.split('\n');
    } else if (ctx.stdin) {
      const stdinChunks: string[] = [];
      for await (const chunk of ctx.stdin) {
        stdinChunks.push(chunk);
      }
      lines = stdinChunks.join('').split('\n');
    } else {
      yield 'grep: missing input\n';
      return;
    }

    try {
      const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
      for (const line of lines) {
        if (regex.test(line)) {
          yield line + '\n';
        }
      }
    } catch {
      yield `grep: invalid pattern: ${pattern}\n`;
    }
  },
};
