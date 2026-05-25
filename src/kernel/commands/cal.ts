import type { Command, CommandContext, OutputChunk } from '../types';

export const calCommand: Command = {
  name: 'cal',
  help: 'Display a calendar.',
  usage: 'cal',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    let result = `    ${monthNames[month]} ${year}\n`;
    result += 'Su Mo Tu We Th Fr Sa\n';

    let line = '';
    for (let i = 0; i < firstDay; i++) {
      line += '   ';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      line += String(d).padStart(2) + ' ';
      if ((firstDay + d) % 7 === 0 || d === daysInMonth) {
        result += line + '\n';
        line = '';
      }
    }

    yield result;
  },
};
