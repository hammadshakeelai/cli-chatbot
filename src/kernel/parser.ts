import type { ParsedCommand } from './types';
import shellQuote from 'shell-quote';

export function parse(input: string): ParsedCommand[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const parsed = shellQuote.parse(trimmed);

  const commands: ParsedCommand[] = [];
  let currentArgs: string[] = [];

  for (const token of parsed) {
    if (typeof token === 'string') {
      currentArgs.push(token);
    }
  }

  if (currentArgs.length > 0) {
    commands.push({
      type: 'command',
      command: currentArgs[0]!,
      args: currentArgs.slice(1),
    });
  }

  return commands;
}
