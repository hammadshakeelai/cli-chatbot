import type { VFS } from '../vfs';
import { getPackage, listAllPackages } from './packages';
import type { PackageManifest } from './packages';

const INSTALLED_PATH = '/var/lib/mirage/installed.json';

function readInstalled(vfs: VFS): string[] {
  const raw = vfs.read(INSTALLED_PATH, '/');
  if (!raw) {
    // First run: neofetch is pre-installed
    const defaults = ['neofetch'];
    writeInstalled(vfs, defaults);
    return defaults;
  }
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeInstalled(vfs: VFS, pkgs: string[]): void {
  vfs.write(INSTALLED_PATH, JSON.stringify(pkgs, null, 2), '/');
}

export function isInstalled(name: string, vfs: VFS): boolean {
  const pkg = getPackage(name);
  if (!pkg) return false;
  const installed = readInstalled(vfs);
  return installed.includes(pkg.name);
}

export function isAppUnlocked(appName: string, vfs: VFS): boolean {
  const installed = readInstalled(vfs);
  const allPkgs = listAllPackages();
  for (const pkg of allPkgs) {
    if (pkg.provides.includes(appName) && installed.includes(pkg.name)) {
      return true;
    }
  }
  return false;
}

export async function* installPackage(
  name: string,
  vfs: VFS,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const pkg = getPackage(name);
  if (!pkg) {
    yield `E: Unable to locate package ${name}\n`;
    return;
  }

  const installed = readInstalled(vfs);
  if (installed.includes(pkg.name)) {
    yield `${pkg.name} is already the newest version (${pkg.version}).\n`;
    return;
  }

  // Resolve deps
  const depsToInstall: PackageManifest[] = [];
  if (pkg.deps) {
    for (const depName of pkg.deps) {
      const dep = getPackage(depName);
      if (dep && !installed.includes(dep.name)) {
        depsToInstall.push(dep);
      }
    }
  }

  const allToInstall = [...depsToInstall, pkg];

  for (const p of allToInstall) {
    if (signal.aborted) {
      yield 'Interrupted.\n';
      return;
    }

    yield `Reading package lists... Done\n`;
    yield `Building dependency tree... Done\n`;
    yield `The following NEW packages will be installed:\n  ${p.name}\n`;

    // Animated download
    const totalFrames = 20;
    for (let frame = 0; frame <= totalFrames; frame++) {
      if (signal.aborted) {
        yield '\r\nInterrupted.\n';
        return;
      }
      const progress = frame / totalFrames;
      const barLen = 30;
      const filled = Math.round(barLen * progress);
      const bar = '[' + '#'.repeat(filled) + ' '.repeat(barLen - filled) + ']';
      const percent = Math.round(progress * 100);
      const downloaded = Math.round(p.size * progress);
      yield `\rUnpacking ${p.name} (${p.version}) ... ${bar} ${percent}% ${downloaded}KB`;
    }
    yield '\n';

    if (signal.aborted) {
      yield 'Interrupted.\n';
      return;
    }

    yield `Setting up ${p.name} (${p.version}) ...\n`;
    const newInstalled = readInstalled(vfs);
    newInstalled.push(p.name);
    writeInstalled(vfs, newInstalled);
  }

  yield `\nDone. ${allToInstall.length} package(s) installed.\n`;
}

export async function* removePackage(
  name: string,
  vfs: VFS,
  _signal: AbortSignal,
): AsyncGenerator<string> {
  const pkg = getPackage(name);
  if (!pkg) {
    yield `E: Unable to locate package ${name}\n`;
    return;
  }

  const installed = readInstalled(vfs);
  if (!installed.includes(pkg.name)) {
    yield `Package '${pkg.name}' is not installed, so not removed\n`;
    return;
  }

  yield `Removing ${pkg.name} (${pkg.version}) ...\n`;
  const updated = installed.filter((p) => p !== pkg.name);
  writeInstalled(vfs, updated);
  yield `Done.\n`;
}

export function listInstalled(vfs: VFS): string[] {
  return readInstalled(vfs);
}
