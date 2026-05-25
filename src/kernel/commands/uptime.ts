import type { Command, CommandContext, OutputChunk } from '../types';

const startTime = Date.now();

export const uptimeCommand: Command = {
  name: 'uptime',
  help: 'Show how long the system has been running.',
  usage: 'uptime',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(elapsed / 86400);
    const hours = Math.floor((elapsed % 86400) / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const users = 1;
    const load = (Math.random() * 2 + 0.1).toFixed(2);

    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days} day${days > 1 ? 's' : ''}, `;
    uptimeStr += `${hours}:${String(minutes).padStart(2, '0')}`;

    yield ` ${uptimeStr} up ${uptimeStr},  ${users} user,  load average: ${load}, ${load}, ${load}\n`;
  },
};
