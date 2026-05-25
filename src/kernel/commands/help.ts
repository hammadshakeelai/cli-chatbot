import type { Command, CommandContext, OutputChunk } from '../types';
import type { CommandRegistry } from '../registry';

const registryRef: { current: CommandRegistry | null } = { current: null };

export function setHelpRegistry(reg: CommandRegistry): void {
  registryRef.current = reg;
}

export const helpCommand: Command = {
  name: 'help',
  help: 'Show help for commands. Usage: help [command]',
  usage: 'help [command]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    if (ctx.args.length > 0) {
      const cmd = registryRef.current?.get(ctx.args[0]!);
      if (!cmd) {
        yield `No help available for '${ctx.args[0]}'\n`;
        return;
      }
      yield `${cmd.name}: ${cmd.help}\n`;
      return;
    }
    const cmds = registryRef.current?.list() ?? [];
    const names = cmds.map((c) => c.name).sort();
    yield 'Available commands:\n';
    yield names.join('  ') + '\n';
    yield '\nType help <command> for details.\n';
  },
};
