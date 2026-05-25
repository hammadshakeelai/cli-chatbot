import type { Command, CommandContext, OutputChunk } from '../types';

const historyRef: { current: string[] } = { current: [] };

export function setHistorySource(src: string[]): void {
  historyRef.current = src;
}

export const historyCommand: Command = {
  name: 'history',
  help: 'Show command history.',
  usage: 'history',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    const items = historyRef.current;
    if (items.length === 0) {
      yield 'No history.\n';
      return;
    }
    for (let i = 0; i < items.length; i++) {
      yield `${String(i + 1).padStart(4)}  ${items[i]}\n`;
    }
  },
};
