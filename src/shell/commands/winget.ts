import type { ShellCommand, ShellCtx } from '../types';
import { sgr, RESET } from '@/term/ansi';

interface FakePackage { id: string; name: string; version: string; sizeMB: number; }

const KNOWN: Record<string, FakePackage> = {
  'figlet': { id: 'Figlet.Figlet', name: 'Figlet', version: '2.2.5', sizeMB: 1.2 },
  'cmatrix': { id: 'Abishek.CMatrix', name: 'CMatrix', version: '2.0', sizeMB: 0.4 },
  'cowsay': { id: 'Cowsay.Cowsay', name: 'Cowsay', version: '3.7.0', sizeMB: 0.2 },
  'nodejs': { id: 'OpenJS.NodeJS', name: 'Node.js', version: '24.4.0', sizeMB: 31.8 },
  'git': { id: 'Git.Git', name: 'Git', version: '2.50.1', sizeMB: 64.5 },
  'vscode': { id: 'Microsoft.VisualStudioCode', name: 'Microsoft Visual Studio Code', version: '1.103.2', sizeMB: 98.1 },
  'powershell': { id: 'Microsoft.PowerShell', name: 'PowerShell', version: '7.5.2', sizeMB: 108.3 },
  'antigravity': { id: 'Google.Antigravity', name: 'Google Antigravity', version: '1.14.2', sizeMB: 142.7 },
};

function packageFor(name: string): FakePackage {
  const key = name.toLowerCase();
  const known = KNOWN[key];
  if (known) return known;
  const pretty = name.charAt(0).toUpperCase() + name.slice(1);
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 7);
  return {
    id: `${pretty}.${pretty}`,
    name: pretty,
    version: `${1 + (h % 8)}.${h % 10}.${h % 4}`,
    sizeMB: Math.round((0.8 + (h % 40)) * 10) / 10,
  };
}

export const wingetCmd: ShellCommand = {
  name: 'winget',
  description: 'Windows Package Manager (simulated)',
  usage: 'winget install <package>',
  interactive: true,
  async run(ctx: ShellCtx) {
    const [sub, ...rest] = ctx.args;
    const io = ctx.io;

    if (!sub || sub === '--help' || ctx.flags.has('help') || ctx.flags.has('?')) {
      io.writeln('Windows Package Manager v1.12.300');
      io.writeln('Copyright (c) Microsoft Corporation. All rights reserved.');
      io.writeln('');
      io.writeln('The winget command line utility enables installing applications from the command line.');
      io.writeln('');
      io.writeln('usage: winget [<command>] [<options>]');
      io.writeln('');
      io.writeln('The following commands are available:');
      io.writeln('  install   Installs the given package');
      io.writeln('  search    Searches for a package');
      io.writeln('  list      Lists installed packages');
      io.writeln('');
      io.writeln(`${sgr.dim}(simulated — nothing is actually installed)${RESET}`);
      return 0;
    }

    if (sub === 'search') {
      const term = rest.join(' ');
      if (!term) { io.writeln('Please provide a search term.'); return 1; }
      const pkg = packageFor(term);
      io.writeln('Name'.padEnd(34) + 'Id'.padEnd(36) + 'Version');
      io.writeln('-'.repeat(80));
      io.writeln(pkg.name.padEnd(34) + pkg.id.padEnd(36) + pkg.version);
      return 0;
    }

    if (sub === 'list') {
      io.writeln('Name'.padEnd(34) + 'Id'.padEnd(36) + 'Version');
      io.writeln('-'.repeat(80));
      for (const pkg of Object.values(KNOWN).slice(0, 5)) {
        io.writeln(pkg.name.padEnd(34) + pkg.id.padEnd(36) + pkg.version);
      }
      return 0;
    }

    if (sub === 'install' || sub === 'add') {
      const target = rest.filter((r) => !r.startsWith('-')).join(' ');
      if (!target) {
        io.writeln('The input cannot be empty. Please provide a package name.');
        return 1;
      }
      const pkg = packageFor(target);

      // Spinner while "resolving"
      const frames = ['-', '\\', '|', '/'];
      for (let i = 0; i < 10; i++) {
        if (ctx.signal.aborted) { io.write('\r\x1b[K'); return 1; }
        io.write('\r' + frames[i % 4]!);
        await ctx.sleep(70);
      }
      io.write('\r\x1b[K');

      io.writeln(`Found ${pkg.name} [${pkg.id}] Version ${pkg.version}`);
      io.writeln('This application is licensed to you by its owner.');
      io.writeln('Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.');
      io.writeln(`Downloading https://dl.mirage.invalid/${pkg.id.toLowerCase().replace(/\./g, '/')}/${pkg.name.toLowerCase()}-${pkg.version}-x64.msix`);

      // Progress bar
      const total = pkg.sizeMB;
      const width = 30;
      const start = Date.now();
      let done = 0;
      while (done < total) {
        if (ctx.signal.aborted) { io.writeln('\nInstall cancelled.'); return 1; }
        const elapsed = (Date.now() - start) / 1000;
        done = Math.min(total, total * (1 - Math.pow(2, -elapsed * 1.4)) + elapsed * 0.6);
        const pct = done / total;
        const filled = Math.round(pct * width);
        io.write('\r  ' + sgr.brightGreen + '█'.repeat(filled) + sgr.dim + '░'.repeat(width - filled) + RESET +
          `  ${done.toFixed(1)} MB / ${total.toFixed(1)} MB`);
        await ctx.sleep(90);
      }
      io.write('\r  ' + sgr.brightGreen + '█'.repeat(width) + RESET +
        `  ${total.toFixed(1)} MB / ${total.toFixed(1)} MB\n`);

      io.writeln('Successfully verified installer hash');
      io.writeln('Starting package install...');
      await ctx.sleep(700 + Math.random() * 600);
      if (ctx.signal.aborted) return 1;
      io.writeln(sgr.brightGreen + 'Successfully installed' + RESET);

      const key = target.toLowerCase();
      if (key === 'figlet' || key === 'cmatrix' || key === 'cowsay') {
        io.writeln(`${sgr.dim}Try running: ${key} ${key === 'figlet' ? 'hello' : ''}${RESET}`);
      } else if (key === 'antigravity') {
        io.writeln(`${sgr.dim}Try running: antigravity${RESET}`);
      }
      return 0;
    }

    io.writeln(`Unrecognized command: '${sub}'`);
    io.writeln('Run winget --help for usage.');
    return 1;
  },
};
