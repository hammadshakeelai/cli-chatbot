import type { ShellCommand, ShellCtx } from '../types';
import { psError } from '../types';
import { sgr, RESET } from '@/term/ansi';
import { APP_NAME, APP_VERSION, HOST_NAME, USER_NAME } from '@/lib/constants';

const BOOT_TIME = Date.now();

export const clearHost: ShellCommand = {
  name: 'Clear-Host',
  aliases: ['cls', 'clear'],
  description: 'Clear the screen',
  interactive: true,
  run(ctx: ShellCtx) {
    ctx.io.clear();
    return 0;
  },
};

export const getDate: ShellCommand = {
  name: 'Get-Date',
  aliases: ['date'],
  description: 'Show the current date and time',
  run(ctx: ShellCtx) {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    ctx.out(`\n${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ` +
      `${h}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} ${ampm}\n\n`);
    return 0;
  },
};

export const whoAmI: ShellCommand = {
  name: 'whoami',
  description: 'Show the current user',
  run(ctx: ShellCtx) {
    ctx.out(`${HOST_NAME.toLowerCase()}\\${USER_NAME}\n`);
    return 0;
  },
};

export const hostName: ShellCommand = {
  name: 'hostname',
  description: 'Show the computer name',
  run(ctx: ShellCtx) {
    ctx.out(HOST_NAME + '\n');
    return 0;
  },
};

export const verCmd: ShellCommand = {
  name: 'ver',
  description: 'Show the Windows version',
  run(ctx: ShellCtx) {
    ctx.out('\nMicrosoft Windows [Version 10.0.26100.4202]\n\n');
    return 0;
  },
};

export const systemInfo: ShellCommand = {
  name: 'systeminfo',
  description: 'Show system configuration',
  run(ctx: ShellCtx) {
    const up = Math.floor((Date.now() - BOOT_TIME) / 1000);
    const rows: [string, string][] = [
      ['Host Name', HOST_NAME],
      ['OS Name', 'Microsoft Windows 11 Pro'],
      ['OS Version', '10.0.26100 N/A Build 26100'],
      ['OS Manufacturer', 'Microsoft Corporation'],
      ['System Type', 'x64-based PC'],
      ['Processor(s)', '1 Processor(s) Installed.'],
      ['', '[01]: Intel64 Family 6 Model 183 ~2200 Mhz'],
      ['Total Physical Memory', '32,768 MB'],
      ['Available Physical Memory', `${(18432 - (up % 512)).toLocaleString()} MB`],
      ['System Boot Time', new Date(BOOT_TIME).toLocaleString()],
      ['Terminal', `${APP_NAME} v${APP_VERSION} (sandboxed — nothing here is real)`],
    ];
    ctx.out('\n' + rows.map(([k, v]) => (k ? (k + ':').padEnd(28) : ' '.repeat(28)) + v).join('\n') + '\n\n');
    return 0;
  },
};

export const getProcess: ShellCommand = {
  name: 'Get-Process',
  aliases: ['ps', 'gps'],
  description: 'List running processes',
  run(ctx: ShellCtx) {
    const procs: [number, number, number, number, number, number, string][] = [
      [1024, 28, 95604, 13280, 142.3, 4, 'chrome'],
      [612, 22, 64212, 88412, 38.6, 8812, 'chrome'],
      [355, 14, 22148, 41020, 12.1, 9120, 'Code'],
      [1450, 45, 188204, 215680, 88.0, 1208, 'explorer'],
      [98, 8, 4120, 9844, 0.3, 668, 'svchost'],
      [201, 11, 12044, 25400, 2.2, 3104, 'WindowsTerminal'],
      [77, 6, 6480, 14200, 1.4, 7222, 'powershell'],
      [42, 4, 2048, 5120, 0.1, 4, 'System'],
    ];
    const lines = [
      '',
      'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName',
      '-------  ------    -----      -----     ------     --  -- -----------',
      ...procs.map(([h, npm, pm, ws, cpu, id, name]) =>
        String(h).padStart(7) + String(npm).padStart(8) + String(pm).padStart(9) +
        String(ws).padStart(11) + cpu.toFixed(2).padStart(11) + String(id).padStart(7) +
        '   1 ' + name),
      '',
    ];
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const getHistory: ShellCommand = {
  name: 'Get-History',
  aliases: ['history', 'h'],
  description: 'Show command history',
  run(ctx: ShellCtx) {
    const lines = ['', '  Id CommandLine', '  -- -----------'];
    ctx.state.history.forEach((cmd, i) => {
      lines.push(String(i + 1).padStart(4) + ' ' + cmd);
    });
    lines.push('');
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const echoCmd: ShellCommand = {
  name: 'Write-Output',
  aliases: ['echo', 'write'],
  description: 'Print text',
  usage: 'echo <text>',
  run(ctx: ShellCtx) {
    if (ctx.args.length === 0 && ctx.stdin !== undefined) {
      ctx.out(ctx.stdin);
      return 0;
    }
    ctx.out(ctx.args.join(' ') + '\n');
    return 0;
  },
};

export const selectString: ShellCommand = {
  name: 'Select-String',
  aliases: ['sls', 'findstr', 'grep'],
  description: 'Search text for a pattern',
  usage: 'sls <pattern> [file...]',
  run(ctx: ShellCtx) {
    const [pattern, ...files] = ctx.args;
    if (!pattern) { ctx.out('Usage: sls <pattern> [file...]\n'); return 1; }
    let re: RegExp;
    try { re = new RegExp(pattern, 'i'); } catch {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const matches: string[] = [];
    if (files.length === 0) {
      const text = ctx.stdin ?? '';
      text.split('\n').forEach((line, i) => {
        if (re.test(line)) matches.push(`${sgr.dim}${i + 1}:${RESET}${line}`);
      });
    } else {
      for (const f of files) {
        const content = ctx.fs.read(f, ctx.state.cwd);
        if (content === undefined) {
          psError(ctx, `sls ${f}`, `Cannot find path '${ctx.fs.resolve(f, ctx.state.cwd)}' because it does not exist.`,
            { exception: '[Select-String]' });
          continue;
        }
        const name = ctx.fs.canonical(f, ctx.state.cwd) ?? f;
        content.split('\n').forEach((line, i) => {
          if (re.test(line)) matches.push(`${sgr.dim}${name}:${i + 1}:${RESET}${line}`);
        });
      }
    }
    if (matches.length) ctx.out('\n' + matches.join('\n') + '\n\n');
    return matches.length ? 0 : 1;
  },
};

export const startSleep: ShellCommand = {
  name: 'Start-Sleep',
  aliases: ['sleep', 'timeout'],
  description: 'Pause for N seconds',
  usage: 'sleep <seconds>',
  async run(ctx: ShellCtx) {
    const secs = Math.min(60, Math.max(0, parseFloat(ctx.args[0] ?? '1') || 1));
    await ctx.sleep(secs * 1000);
    return 0;
  },
};

export const ipConfig: ShellCommand = {
  name: 'ipconfig',
  description: 'Show network configuration',
  run(ctx: ShellCtx) {
    ctx.out([
      '',
      'Windows IP Configuration',
      '',
      'Ethernet adapter Ethernet:',
      '',
      '   Connection-specific DNS Suffix  . : lan',
      '   Link-local IPv6 Address . . . . . : fe80::3d4f:9a21:7c55:1b2e%12',
      '   IPv4 Address. . . . . . . . . . . : 192.168.1.108',
      '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
      '   Default Gateway . . . . . . . . . : 192.168.1.1',
      '',
      'Wireless LAN adapter Wi-Fi:',
      '',
      '   Media State . . . . . . . . . . . : Media disconnected',
      '   Connection-specific DNS Suffix  . : ',
      '',
    ].join('\n') + '\n');
    return 0;
  },
};

export const pingCmd: ShellCommand = {
  name: 'ping',
  description: 'Test a network connection (simulated)',
  usage: 'ping <host>',
  interactive: true,
  async run(ctx: ShellCtx) {
    const host = ctx.args[0] ?? 'localhost';
    const ip = host === 'localhost' ? '127.0.0.1'
      : `104.21.${(host.length * 7) % 255}.${(host.length * 13) % 255}`;
    ctx.io.writeln('');
    ctx.io.writeln(`Pinging ${host} [${ip}] with 32 bytes of data:`);
    const times: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (ctx.signal.aborted) return 1;
      await ctx.sleep(380 + Math.random() * 320);
      if (ctx.signal.aborted) return 1;
      const t = host === 'localhost' ? 0 : Math.floor(8 + Math.random() * 26);
      times.push(t);
      ctx.io.writeln(`Reply from ${ip}: bytes=32 time${t === 0 ? '<1ms' : `=${t}ms`} TTL=117`);
    }
    const min = Math.min(...times); const max = Math.max(...times);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    ctx.io.writeln('');
    ctx.io.writeln(`Ping statistics for ${ip}:`);
    ctx.io.writeln('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
    ctx.io.writeln('Approximate round trip times in milli-seconds:');
    ctx.io.writeln(`    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`);
    ctx.io.writeln('');
    return 0;
  },
};

export const exitCmd: ShellCommand = {
  name: 'exit',
  description: 'Close this tab',
  run(ctx: ShellCtx) {
    ctx.host.closeTab();
    return 0;
  },
};

export const wslCmd: ShellCommand = {
  name: 'wsl',
  description: 'Windows Subsystem for Linux',
  hidden: true,
  run(ctx: ShellCtx) {
    ctx.out('Windows Subsystem for Linux has no installed distributions.\n' +
      'Distributions can be installed by visiting the Microsoft Store:\n' +
      'https://aka.ms/wslstore\n' +
      `${sgr.dim}(this terminal is already imaginary — a Linux inside it felt excessive)${RESET}\n`);
    return 1;
  },
};

export const codeCmd: ShellCommand = {
  name: 'code',
  description: 'Open Visual Studio Code',
  hidden: true,
  async run(ctx: ShellCtx) {
    ctx.io.write(sgr.dim + 'Opening Visual Studio Code…' + RESET);
    await ctx.sleep(900);
    ctx.io.write('\r\x1b[K');
    ctx.io.writeln(`${sgr.dim}VS Code declined to open inside a simulated terminal. Fair enough.${RESET}`);
    return 1;
  },
};

export const explorerCmd: ShellCommand = {
  name: 'explorer',
  description: 'Open File Explorer',
  hidden: true,
  run(ctx: ShellCtx) {
    ctx.out(`${sgr.dim}File Explorer is busy exploring files that do not exist. Try 'dir' instead.${RESET}\n`);
    return 0;
  },
};

export const SYS_COMMANDS: ShellCommand[] = [
  clearHost, getDate, whoAmI, hostName, verCmd, systemInfo, getProcess,
  getHistory, echoCmd, selectString, startSleep, ipConfig, pingCmd, exitCmd,
  wslCmd, codeCmd, explorerCmd,
];
