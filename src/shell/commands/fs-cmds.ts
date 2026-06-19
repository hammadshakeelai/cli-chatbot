import type { ShellCommand, ShellCtx } from '../types';
import { psError, fmtDate } from '../types';
import type { WinNode } from '../winfs';

function sizeOf(node: WinNode): string {
  if (node.kind === 'dir') return '';
  return String((node.content ?? '').length);
}

function modeOf(node: WinNode): string {
  return node.kind === 'dir' ? 'd-----' : '-a----';
}

export const getChildItem: ShellCommand = {
  name: 'Get-ChildItem',
  aliases: ['ls', 'dir', 'gci'],
  description: 'List the items in a directory',
  usage: 'Get-ChildItem [path]',
  run(ctx: ShellCtx) {
    const target = ctx.args[0] ?? '.';
    const display = ctx.fs.canonical(target, ctx.state.cwd);
    const items = ctx.fs.list(target, ctx.state.cwd);
    if (!display || !items) {
      const node = ctx.fs.stat(target, ctx.state.cwd);
      if (node?.kind === 'file') {
        // Listing a file shows the file row (like real PS)
        ctx.out(formatListing(ctx.fs.resolve(target, ctx.state.cwd), [node], true));
        return 0;
      }
      psError(ctx, ctx.args[0] ? `dir ${target}` : 'dir',
        `Cannot find path '${ctx.fs.resolve(target, ctx.state.cwd)}' because it does not exist.`,
        { exception: '[Get-ChildItem]', errorId: 'PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand', target: ctx.fs.resolve(target, ctx.state.cwd) });
      return 1;
    }
    if (items.length === 0) return 0;
    ctx.out(formatListing(display, items, false));
    return 0;
  },
};

function formatListing(dir: string, items: WinNode[], single: boolean): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(`    Directory: ${single ? dir.slice(0, dir.lastIndexOf('\\')) || dir : dir}`);
  lines.push('');
  lines.push('Mode                 LastWriteTime         Length Name');
  lines.push('----                 -------------         ------ ----');
  for (const node of items) {
    lines.push(
      modeOf(node).padEnd(12) +
      fmtDate(node.mtime).padStart(21) +
      sizeOf(node).padStart(15) + ' ' +
      node.name,
    );
  }
  lines.push('');
  return lines.join('\n') + '\n';
}

export const setLocation: ShellCommand = {
  name: 'Set-Location',
  aliases: ['cd', 'chdir', 'sl'],
  description: 'Change the current directory',
  usage: 'Set-Location <path>',
  run(ctx: ShellCtx) {
    const target = ctx.args[0] ?? '~';
    const abs = ctx.fs.resolve(target, ctx.state.cwd);
    const found = ctx.fs.lookup(abs);
    if (!found) {
      psError(ctx, `cd ${target}`, `Cannot find path '${abs}' because it does not exist.`,
        { exception: '[Set-Location]', errorId: 'PathNotFound,Microsoft.PowerShell.Commands.SetLocationCommand', target: abs });
      return 1;
    }
    if (found.node.kind !== 'dir') {
      psError(ctx, `cd ${target}`, `Cannot set the location because path '${abs}' resolved to a file.`,
        { exception: '[Set-Location]', errorId: 'NotDirectory,Microsoft.PowerShell.Commands.SetLocationCommand', target: abs });
      return 1;
    }
    ctx.state.cwd = found.display;
    return 0;
  },
};

export const getLocation: ShellCommand = {
  name: 'Get-Location',
  aliases: ['pwd', 'gl'],
  description: 'Show the current directory',
  run(ctx: ShellCtx) {
    ctx.out(`\nPath\n----\n${ctx.state.cwd}\n\n`);
    return 0;
  },
};

export const getContent: ShellCommand = {
  name: 'Get-Content',
  aliases: ['cat', 'type', 'gc'],
  description: 'Print the contents of a file',
  usage: 'Get-Content <file>',
  run(ctx: ShellCtx) {
    if (ctx.args.length === 0 && ctx.stdin !== undefined) {
      ctx.out(ctx.stdin);
      return 0;
    }
    if (ctx.args.length === 0) {
      psError(ctx, 'cat', 'Cannot bind argument to parameter \'Path\' because it is null.',
        { category: 'InvalidData', exception: '[Get-Content]', errorId: 'ParameterArgumentValidationErrorNullNotAllowed,Microsoft.PowerShell.Commands.GetContentCommand' });
      return 1;
    }
    let code = 0;
    for (const arg of ctx.args) {
      const content = ctx.fs.read(arg, ctx.state.cwd);
      if (content === undefined) {
        const abs = ctx.fs.resolve(arg, ctx.state.cwd);
        psError(ctx, `cat ${arg}`, `Cannot find path '${abs}' because it does not exist.`,
          { exception: '[Get-Content]', errorId: 'PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand', target: abs });
        code = 1;
        continue;
      }
      ctx.out(content.endsWith('\n') ? content : content + '\n');
    }
    return code;
  },
};

export const newItem: ShellCommand = {
  name: 'New-Item',
  aliases: ['ni', 'touch'],
  description: 'Create a new empty file',
  usage: 'New-Item <file>',
  run(ctx: ShellCtx) {
    if (ctx.args.length === 0) { ctx.out('Usage: ni <file>\n'); return 1; }
    let code = 0;
    for (const arg of ctx.args) {
      if (ctx.flags.has('directory') || ctx.flags.has('itemtype')) {
        const err = ctx.fs.mkdir(arg, ctx.state.cwd);
        if (err) { psError(ctx, `ni ${arg}`, err, { exception: '[New-Item]' }); code = 1; }
        continue;
      }
      if (!ctx.fs.exists(arg, ctx.state.cwd)) {
        const err = ctx.fs.write(arg, '', ctx.state.cwd);
        if (err) { psError(ctx, `ni ${arg}`, err, { exception: '[New-Item]' }); code = 1; }
      }
    }
    return code;
  },
};

export const mkDir: ShellCommand = {
  name: 'mkdir',
  aliases: ['md'],
  description: 'Create a directory',
  usage: 'mkdir <path>',
  run(ctx: ShellCtx) {
    if (ctx.args.length === 0) { ctx.out('Usage: mkdir <path>\n'); return 1; }
    let code = 0;
    for (const arg of ctx.args) {
      if (ctx.fs.exists(arg, ctx.state.cwd)) {
        const abs = ctx.fs.resolve(arg, ctx.state.cwd);
        psError(ctx, `mkdir ${arg}`, `An item with the specified name ${abs} already exists.`,
          { category: 'ResourceExists', exception: '[New-Item]', errorId: 'DirectoryExist,Microsoft.PowerShell.Commands.NewItemCommand', target: abs });
        code = 1;
        continue;
      }
      const err = ctx.fs.mkdir(arg, ctx.state.cwd);
      if (err) { psError(ctx, `mkdir ${arg}`, err, { exception: '[New-Item]' }); code = 1; }
    }
    return code;
  },
};

export const removeItem: ShellCommand = {
  name: 'Remove-Item',
  aliases: ['rm', 'del', 'rd', 'rmdir', 'ri', 'erase'],
  description: 'Delete files and directories',
  usage: 'Remove-Item <path> [-Recurse]',
  run(ctx: ShellCtx) {
    if (ctx.args.length === 0) { ctx.out('Usage: rm <path> [-Recurse]\n'); return 1; }
    const recurse = ctx.flags.has('recurse') || ctx.flags.has('r') || ctx.flags.has('rf') || ctx.flags.has('force');
    let code = 0;
    for (const arg of ctx.args) {
      const err = ctx.fs.remove(arg, ctx.state.cwd, recurse);
      if (err) {
        psError(ctx, `rm ${arg}`, err, {
          exception: '[Remove-Item]',
          errorId: err.includes('does not exist')
            ? 'PathNotFound,Microsoft.PowerShell.Commands.RemoveItemCommand'
            : 'DirectoryNotEmpty,Microsoft.PowerShell.Commands.RemoveItemCommand',
          target: ctx.fs.resolve(arg, ctx.state.cwd),
        });
        code = 1;
      }
    }
    return code;
  },
};

export const copyItem: ShellCommand = {
  name: 'Copy-Item',
  aliases: ['cp', 'copy', 'cpi'],
  description: 'Copy a file or directory',
  usage: 'Copy-Item <src> <dest>',
  run(ctx: ShellCtx) {
    const [src, dest] = ctx.args;
    if (!src || !dest) { ctx.out('Usage: cp <source> <destination>\n'); return 1; }
    const err = ctx.fs.copy(src, dest, ctx.state.cwd);
    if (err) { psError(ctx, `cp ${src}`, err, { exception: '[Copy-Item]' }); return 1; }
    return 0;
  },
};

export const moveItem: ShellCommand = {
  name: 'Move-Item',
  aliases: ['mv', 'move', 'mi'],
  description: 'Move a file or directory',
  usage: 'Move-Item <src> <dest>',
  run(ctx: ShellCtx) {
    const [src, dest] = ctx.args;
    if (!src || !dest) { ctx.out('Usage: mv <source> <destination>\n'); return 1; }
    const err = ctx.fs.move(src, dest, ctx.state.cwd);
    if (err) { psError(ctx, `mv ${src}`, err, { exception: '[Move-Item]' }); return 1; }
    return 0;
  },
};

export const renameItem: ShellCommand = {
  name: 'Rename-Item',
  aliases: ['ren', 'rni'],
  description: 'Rename a file or directory',
  usage: 'Rename-Item <path> <new name>',
  run(ctx: ShellCtx) {
    const [src, newName] = ctx.args;
    if (!src || !newName) { ctx.out('Usage: ren <path> <new name>\n'); return 1; }
    const abs = ctx.fs.resolve(src, ctx.state.cwd);
    const parent = abs.slice(0, abs.lastIndexOf('\\')) || 'C:\\';
    const err = ctx.fs.move(src, parent + '\\' + newName, ctx.state.cwd);
    if (err) { psError(ctx, `ren ${src}`, err, { exception: '[Rename-Item]' }); return 1; }
    return 0;
  },
};

export const treeCmd: ShellCommand = {
  name: 'tree',
  description: 'Graphically display the directory structure',
  usage: 'tree [path] [/f]',
  run(ctx: ShellCtx) {
    const showFiles = ctx.flags.has('f') || ctx.args.some((a) => a.toLowerCase() === '/f');
    const args = ctx.args.filter((a) => !a.startsWith('/'));
    const target = args[0] ?? '.';
    const display = ctx.fs.canonical(target, ctx.state.cwd);
    if (!display || ctx.fs.stat(target, ctx.state.cwd)?.kind !== 'dir') {
      ctx.out('Invalid path - ' + ctx.fs.resolve(target, ctx.state.cwd).toUpperCase() + '\n');
      return 1;
    }
    const lines: string[] = [];
    lines.push('Folder PATH listing');
    lines.push('Volume serial number is 5E21-A0C3');
    lines.push(display === 'C:\\' ? 'C:.' : display.toUpperCase());
    const walk = (path: string, prefix: string) => {
      const items = (ctx.fs.list(path, ctx.state.cwd) ?? [])
        .filter((n) => showFiles || n.kind === 'dir');
      items.forEach((node, i) => {
        const last = i === items.length - 1;
        const branch = last ? '└───' : '├───';
        if (node.kind === 'dir') {
          lines.push(prefix + branch + node.name);
          walk(path + '\\' + node.name, prefix + (last ? '    ' : '│   '));
        } else {
          lines.push(prefix + (last ? '└───' : '├───') + node.name);
        }
      });
    };
    walk(display, '');
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const FS_COMMANDS: ShellCommand[] = [
  getChildItem, setLocation, getLocation, getContent, newItem, mkDir,
  removeItem, copyItem, moveItem, renameItem, treeCmd,
];
