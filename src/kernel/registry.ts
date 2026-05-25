import type { Command } from './types';

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(cmd: Command): void {
    this.commands.set(cmd.name, cmd);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  list(): Command[] {
    return Array.from(this.commands.values());
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }
}
