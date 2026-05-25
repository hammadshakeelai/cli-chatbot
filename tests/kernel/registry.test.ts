import { describe, it, expect } from 'vitest';
import { CommandRegistry } from '@/kernel/registry';
import { echoCommand } from '@/kernel/commands/echo';

describe('CommandRegistry', () => {
  it('register and get a command', () => {
    const reg = new CommandRegistry();
    reg.register(echoCommand);
    expect(reg.get('echo')).toBe(echoCommand);
  });

  it('returns undefined for unknown command', () => {
    const reg = new CommandRegistry();
    expect(reg.get('nonexistent')).toBeUndefined();
  });

  it('list returns all registered commands', () => {
    const reg = new CommandRegistry();
    reg.register(echoCommand);
    const list = reg.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('echo');
  });

  it('has checks existence', () => {
    const reg = new CommandRegistry();
    reg.register(echoCommand);
    expect(reg.has('echo')).toBe(true);
    expect(reg.has('nope')).toBe(false);
  });
});
