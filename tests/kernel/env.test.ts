import { describe, it, expect } from 'vitest';
import { Env } from '@/kernel/env';

describe('Env', () => {
  it('has default variables', () => {
    const env = new Env();
    expect(env.get('HOME')).toBe('/home/user');
    expect(env.get('USER')).toBe('user');
    expect(env.get('SHELL')).toBe('mirage');
  });

  it('set and get', () => {
    const env = new Env();
    env.set('MY_VAR', 'value');
    expect(env.get('MY_VAR')).toBe('value');
  });

  it('export adds a variable', () => {
    const env = new Env();
    env.export('FOO', 'bar');
    expect(env.get('FOO')).toBe('bar');
  });

  it('unset removes a variable', () => {
    const env = new Env();
    env.set('TEMP', 'val');
    env.unset('TEMP');
    expect(env.get('TEMP')).toBeUndefined();
  });

  it('expand substitutes $VAR', () => {
    const env = new Env();
    expect(env.expand('hello $USER')).toBe('hello user');
  });

  it('expand leaves unknown vars intact', () => {
    const env = new Env();
    expect(env.expand('$NONEXISTENT')).toBe('$NONEXISTENT');
  });

  it('expand handles ${VAR} syntax', () => {
    const env = new Env();
    expect(env.expand('${USER} is here')).toBe('user is here');
  });

  it('entries returns all variables', () => {
    const env = new Env();
    const entries = env.entries();
    expect(entries.length).toBeGreaterThanOrEqual(6);
    expect(entries).toContainEqual(['HOME', '/home/user']);
  });

  it('serialize and restore', () => {
    const env = new Env();
    env.set('CUSTOM', 'value');
    const data = env.toJSON();
    const env2 = new Env();
    env2.fromJSON(data);
    expect(env2.get('CUSTOM')).toBe('value');
    expect(env2.get('HOME')).toBe('/home/user');
  });
});
