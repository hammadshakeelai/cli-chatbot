import type { Command, CommandContext, OutputChunk } from '../types';

export const psCommand: Command = {
  name: 'ps',
  help: 'Report process status.',
  usage: 'ps [aux]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const all = ctx.flags['a'] === true || ctx.flags['aux'] === true || ctx.flags['ax'] === true;
    if (all) {
      yield 'USER       PID  %CPU  %MEM  VSZ    RSS    TTY   STAT  START  TIME  COMMAND\n';
      yield `user         1   0.0   0.1  1234   56    ?     S     ${new Date().toLocaleTimeString()}  0:00  /sbin/init\n`;
      yield `user       123   0.5   2.3  45678  1234  pts/0 Ss+   ${new Date().toLocaleTimeString()}  0:02  mirage\n`;
    } else {
      yield '  PID TTY          TIME CMD\n';
      yield '  123 pts/0    00:00:02 mirage\n';
    }
  },
};
