import type { Command, CommandContext, OutputChunk } from '../types';
import { searchPackages, listAllPackages, getPackage } from '../apt/packages';
import { installPackage, removePackage, listInstalled, isInstalled } from '../apt/installer';

export const aptCommand: Command = {
  name: 'apt',
  help: 'Package manager. Usage: apt [install|remove|search|list|update] <package>',
  usage: 'apt [install|remove|search|list|update] [package]',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const subcommand = ctx.args[0];

    if (!subcommand) {
      yield 'Usage: apt [install|remove|search|list|update] <package>\n';
      return;
    }

    switch (subcommand) {
      case 'update': {
        yield 'Hit:1 http://archive.mirage.io jammy InRelease\n';
        yield 'Get:2 http://archive.mirage.io jammy/main amd64 Packages [1.2 kB]\n';
        yield 'Fetched 1.2 kB in 0s (12.3 kB/s)\n';
        yield 'Reading package lists... Done\n';
        break;
      }

      case 'install': {
        const pkgName = ctx.args[1];
        if (!pkgName) {
          yield 'apt install <package>\n';
          return;
        }
        yield* installPackage(pkgName, ctx.vfs, ctx.signal);
        break;
      }

      case 'remove': {
        const pkgName = ctx.args[1];
        if (!pkgName) {
          yield 'apt remove <package>\n';
          return;
        }
        yield* removePackage(pkgName, ctx.vfs, ctx.signal);
        break;
      }

      case 'search': {
        const query = ctx.args.slice(1).join(' ');
        if (!query) {
          yield 'apt search <query>\n';
          return;
        }
        const results = searchPackages(query);
        if (results.length === 0) {
          yield `No packages found matching '${query}'.\n`;
          return;
        }
        for (const pkg of results) {
          const installed = isInstalled(pkg.name, ctx.vfs);
          const marker = installed ? '[installed]' : '';
          yield `${pkg.name}/${pkg.version} ${marker}\n  ${pkg.description}\n`;
        }
        break;
      }

      case 'list': {
        const showInstalled = ctx.args.includes('--installed');
        const packages = showInstalled
          ? listInstalled(ctx.vfs).map((name) => getPackage(name)).filter(Boolean)
          : listAllPackages();

        if (packages.length === 0) {
          yield (showInstalled ? 'No installed packages.\n' : 'No packages available.\n');
          return;
        }

        for (const pkg of packages) {
          const installed = isInstalled(pkg!.name, ctx.vfs);
          const marker = installed ? '[installed]' : '';
          yield `${pkg!.name}/${pkg!.version} ${marker}\n`;
        }
        break;
      }

      default:
        yield `Unknown command: apt ${subcommand}\n`;
    }
  },
};
