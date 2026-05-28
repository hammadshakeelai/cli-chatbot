import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from '@/kernel/vfs';
import { getPackage, searchPackages, listAllPackages } from '@/kernel/apt/packages';
import { isInstalled, isAppUnlocked, installPackage, removePackage, listInstalled } from '@/kernel/apt/installer';

async function runInstall(pkg: string, vfs: VFS): Promise<string> {
  const gen = installPackage(pkg, vfs, new AbortController().signal);
  let output = '';
  for await (const chunk of gen) output += chunk;
  return output;
}

async function runRemove(pkg: string, vfs: VFS): Promise<string> {
  const gen = removePackage(pkg, vfs, new AbortController().signal);
  let output = '';
  for await (const chunk of gen) output += chunk;
  return output;
}

describe('apt packages', () => {
  it('getPackage returns package by name', () => {
    const pkg = getPackage('figlet');
    expect(pkg).toBeDefined();
    expect(pkg!.name).toBe('figlet');
  });

  it('getPackage returns undefined for unknown', () => {
    expect(getPackage('nonexistent')).toBeUndefined();
  });

  it('searchPackages finds by keyword', () => {
    const results = searchPackages('fig');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.name === 'figlet')).toBe(true);
  });

  it('searchPackages is case-insensitive', () => {
    const results = searchPackages('CMATRIX');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.name === 'cmatrix')).toBe(true);
  });

  it('listAllPackages returns all packages', () => {
    const all = listAllPackages();
    expect(all.length).toBeGreaterThanOrEqual(8);
    expect(all.some((p) => p.name === 'cowsay')).toBe(true);
    expect(all.some((p) => p.name === 'nyancat')).toBe(true);
  });
});

describe('apt installer', () => {
  let vfs: VFS;

  beforeEach(() => {
    vfs = new VFS();
    vfs.mkdir('/', 'var');
    vfs.mkdir('/var', 'lib');
    vfs.mkdir('/var/lib', 'mirage');
  });

  it('isInstalled returns false initially', () => {
    expect(isInstalled('figlet', vfs)).toBe(false);
  });

  it('installPackage makes a command available', async () => {
    const output = await runInstall('figlet', vfs);
    expect(output).toContain('Done');
    expect(isInstalled('figlet', vfs)).toBe(true);
  });

  it('installPackage reports already installed', async () => {
    await runInstall('figlet', vfs);
    const output = await runInstall('figlet', vfs);
    expect(output).toContain('already the newest version');
  });

  it('removePackage removes installation', async () => {
    await runInstall('figlet', vfs);
    const output = await runRemove('figlet', vfs);
    expect(output).toContain('Removing');
    expect(isInstalled('figlet', vfs)).toBe(false);
  });

  it('listInstalled shows installed packages', () => {
    const list = listInstalled(vfs);
    expect(Array.isArray(list)).toBe(true);
  });

  it('isAppUnlocked checks installation', async () => {
    expect(isAppUnlocked('cmatrix', vfs)).toBe(false);
    await runInstall('cmatrix', vfs);
    expect(isAppUnlocked('cmatrix', vfs)).toBe(true);
  });
});
