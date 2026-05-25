import type { Command, CommandContext, OutputChunk } from '../types';

export const dayCommand: Command = {
  name: 'day',
  help: 'Switch to light mode.',
  usage: 'day',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    // Handled by store
    yield '\x1b[2mSwitching to light mode...\x1b[0m\n';
  },
};

export const nightCommand: Command = {
  name: 'night',
  help: 'Switch to dark mode.',
  usage: 'night',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    yield '\x1b[2mSwitching to dark mode...\x1b[0m\n';
  },
};
