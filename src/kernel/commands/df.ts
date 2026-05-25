import type { Command, CommandContext, OutputChunk } from '../types';

export const dfCommand: Command = {
  name: 'df',
  help: 'Report file system disk space usage.',
  usage: 'df [-h]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const human = ctx.flags['h'] === true;
    const total = 1024 * 1024;
    const used = Math.floor(total * 0.35);
    const avail = total - used;
    const pct = Math.round((used / total) * 100);

    if (human) {
      yield 'Filesystem      Size  Used  Avail  Use%  Mounted on\n';
      yield `mirage:root     1.0M  358K   666K   35%  /\n`;
    } else {
      yield 'Filesystem     1K-blocks  Used  Available  Use%  Mounted on\n';
      yield `mirage:root     ${String(total).padStart(9)} ${String(used).padStart(4)} ${String(avail).padStart(9)}  ${String(pct).padStart(3)}%  /\n`;
    }
  },
};
