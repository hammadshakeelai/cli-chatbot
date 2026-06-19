import type { Repl, TermIO, ReplHost, Completion } from '@/term/types';
import { sgr, RESET, fgHex, stripAnsi } from '@/term/ansi';
import { HOME_DIR, HOST_NAME, USER_NAME, APP_NAME, APP_VERSION } from '@/lib/constants';
import { WinFS } from './winfs';
import { parseLine } from './parse';
import type { ParsedCmd } from './parse';
import type { ShellCommand, ShellCtx, ShellState } from './types';
import { FS_COMMANDS } from './commands/fs-cmds';
import { SYS_COMMANDS } from './commands/sys-cmds';
import { FUN_COMMANDS } from './commands/fun-cmds';
import { wingetCmd } from './commands/winget';
import { AGENTS, agentByCommand } from '@/agents/registry';
import { createAgentRepl } from '@/agents/runner';

const RED = '\x1b[91m';

function defaultEnv(): Map<string, string> {
  return new Map<string, string>([
    ['COMPUTERNAME', HOST_NAME],
    ['USERNAME', USER_NAME],
    ['USERPROFILE', HOME_DIR],
    ['HOMEDRIVE', 'C:'],
    ['HOMEPATH', '\\Users\\' + USER_NAME],
    ['OS', 'Windows_NT'],
    ['PROCESSOR_ARCHITECTURE', 'AMD64'],
    ['NUMBER_OF_PROCESSORS', '16'],
    ['TEMP', 'C:\\Temp'],
    ['TMP', 'C:\\Temp'],
    ['PATH', 'C:\\Windows\\System32;C:\\Windows;C:\\Program Files\\PowerShell'],
    ['PSModulePath', 'C:\\Program Files\\WindowsPowerShell\\Modules'],
  ]);
}

export class ShellRepl implements Repl {
  id = 'powershell';
  history: string[];
  state: ShellState;

  private commandList: ShellCommand[] = [];
  private lookup = new Map<string, ShellCommand>();

  constructor(private fs: WinFS) {
    this.state = { cwd: HOME_DIR, env: defaultEnv(), lastExit: 0, history: [] };
    this.history = this.state.history;
    this.registerAll();
  }

  /* ── registry ───────────────────────────────────────────────────────── */

  private registerAll(): void {
    const agentLaunchers: ShellCommand[] = AGENTS.map((agent) => ({
      name: agent.command,
      description: `Launch ${agent.label} — ${agent.sublabel}`,
      interactive: true,
      async run(ctx: ShellCtx) {
        await ctx.host.pushRepl(createAgentRepl(agent, ctx.state.cwd));
        return 0;
      },
    }));

    const agentsCmd: ShellCommand = {
      name: 'agents',
      description: 'List the available AI agent CLIs',
      run(ctx: ShellCtx) {
        const lines = ['', `  ${sgr.bold}AI agent CLIs${RESET} ${sgr.dim}— type the command to launch one${RESET}`, ''];
        for (const a of AGENTS) {
          lines.push(
            '  ' + fgHex(a.accent) + a.icon.padEnd(3) + RESET +
            sgr.bold + a.command.padEnd(13) + RESET +
            a.label.padEnd(17) + sgr.dim + a.sublabel + RESET,
          );
        }
        lines.push('');
        lines.push(`  ${sgr.dim}inside an agent: /help · /clear · /exit${RESET}`);
        lines.push('');
        ctx.out(lines.join('\n') + '\n');
        return 0;
      },
    };

    const self = this;

    const helpCmd: ShellCommand = {
      name: 'Get-Help',
      aliases: ['help', 'man'],
      description: 'Show this help',
      run(ctx: ShellCtx) {
        ctx.out(self.helpText());
        return 0;
      },
    };

    const getCommand: ShellCommand = {
      name: 'Get-Command',
      aliases: ['gcm'],
      description: 'List all commands',
      run(ctx: ShellCtx) {
        const lines = ['', 'CommandType     Name                              Aliases', '-----------     ----                              -------'];
        for (const c of self.commandList) {
          if (c.hidden) continue;
          const kind = agentByCommand(c.name) ? 'Agent' : c.name.includes('-') ? 'Cmdlet' : 'Application';
          lines.push(kind.padEnd(16) + c.name.padEnd(34) + (c.aliases ?? []).join(', '));
        }
        lines.push('');
        ctx.out(lines.join('\n') + '\n');
        return 0;
      },
    };

    this.commandList = [
      ...FS_COMMANDS, ...SYS_COMMANDS, ...FUN_COMMANDS, wingetCmd,
      ...agentLaunchers, agentsCmd, helpCmd, getCommand,
    ];
    for (const cmd of this.commandList) {
      this.lookup.set(cmd.name.toLowerCase(), cmd);
      for (const a of cmd.aliases ?? []) this.lookup.set(a.toLowerCase(), cmd);
    }
  }

  private helpText(): string {
    const dim = sgr.dim;
    const b = sgr.bold;
    const acc = fgHex('#4cc2ff');
    const agentRows = AGENTS.map((a) =>
      `    ${fgHex(a.accent)}${a.command.padEnd(13)}${RESET}${dim}${a.label} — ${a.sublabel}${RESET}`).join('\n');
    return [
      '',
      `  ${b}${APP_NAME}${RESET} ${dim}v${APP_VERSION} — a PowerShell that isn't there${RESET}`,
      '',
      `  ${acc}${b}AI AGENTS${RESET} ${dim}(the fun part — type one)${RESET}`,
      agentRows,
      '',
      `  ${acc}${b}SHELL${RESET}`,
      `    ${b}dir ls${RESET}        list files          ${b}cd <path>${RESET}     change directory`,
      `    ${b}cat <file>${RESET}    print a file        ${b}tree /f${RESET}       directory tree`,
      `    ${b}mkdir rm cp mv ren${RESET}                file operations`,
      `    ${b}cls${RESET}           clear screen        ${b}history${RESET}       command history`,
      `    ${b}echo sls${RESET}      text + search       ${b}ps date whoami systeminfo${RESET}`,
      '',
      `  ${acc}${b}FUN${RESET}`,
      `    ${b}winfetch${RESET} · ${b}figlet <text>${RESET} · ${b}cowsay <text>${RESET} · ${b}cmatrix${RESET} · ${b}lolcat${RESET}`,
      `    ${b}winget install <pkg>${RESET} · ${b}ping <host>${RESET}`,
      '',
      `  ${acc}${b}TIPS${RESET}`,
      `    ${dim}Tab completes commands & paths · ↑↓ history · Ctrl+R searches history${RESET}`,
      `    ${dim}Pipes work: ${RESET}dir | sls demo${dim} · redirects too: ${RESET}echo hi > note.txt`,
      `    ${dim}Esc / Ctrl+C interrupts · Alt+T new tab · Ctrl+Shift+P palette${RESET}`,
      '',
    ].join('\n') + '\n';
  }

  /* ── Repl interface ─────────────────────────────────────────────────── */

  prompt(): string {
    return `PS ${this.state.cwd}> `;
  }

  onAttach(io: TermIO, firstTime: boolean): void {
    io.setTitle('Windows PowerShell');
    if (!firstTime) return;
    io.writeln('Windows PowerShell');
    io.writeln('Copyright (C) Microsoft Corporation. All rights reserved.');
    io.writeln('');
    io.writeln('Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows');
    io.writeln('');
    io.writeln(sgr.dim + `${APP_NAME}: type 'help' for commands · 'agents' for the AI CLIs.` + RESET);
    io.writeln('');
  }

  async run(line: string, io: TermIO, host: ReplHost): Promise<void> {
    let text = line.trim();
    if (!text) return;

    // DOS habits
    if (/^cd\.\.$/i.test(text)) text = 'cd ..';
    if (/^cd\\$/i.test(text)) text = 'cd \\';

    // $PSVersionTable / $env:X direct echo
    if (/^\$psversiontable$/i.test(text)) {
      io.write([
        '',
        'Name                           Value',
        '----                           -----',
        'PSVersion                      5.1.26100.4202',
        'PSEdition                      Desktop',
        'PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}',
        'BuildVersion                   10.0.26100.4202',
        'CLRVersion                     4.0.30319.42000',
        'WSManStackVersion              3.0',
        'PSRemotingProtocolVersion      2.3',
        'SerializationVersion           1.1.0.1',
        '', '',
      ].join('\n'));
      return;
    }
    const envEcho = /^\$env:([A-Za-z_][A-Za-z0-9_]*)$/i.exec(text);
    if (envEcho) {
      const v = this.getEnv(envEcho[1]!);
      io.writeln(v ?? '');
      return;
    }

    const expanded = text.replace(/\$env:([A-Za-z_][A-Za-z0-9_]*)/gi,
      (_, name: string) => this.getEnv(name) ?? '');

    const statements = parseLine(expanded);
    for (const stmt of statements) {
      if (io.signal().aborted) break;
      if (stmt.op === '&&' && this.state.lastExit !== 0) continue;
      await this.runPipeline(stmt.pipeline, io, host);
    }
  }

  private getEnv(name: string): string | undefined {
    for (const [k, v] of this.state.env) {
      if (k.toLowerCase() === name.toLowerCase()) return v;
    }
    return undefined;
  }

  private async runPipeline(pipeline: ParsedCmd[], io: TermIO, host: ReplHost): Promise<void> {
    let stdin: string | undefined;

    for (let i = 0; i < pipeline.length; i++) {
      if (io.signal().aborted) return;
      const pc = pipeline[i]!;
      const def = this.lookup.get(pc.name.toLowerCase());

      if (!def) {
        this.commandNotFound(pc, io);
        this.state.lastExit = 9009;
        return;
      }

      const isLast = i === pipeline.length - 1;
      const { args, flags } = splitFlags(pc.args);
      const globbed = expandGlobs(args, this.fs, this.state.cwd);

      let buf = '';
      const buffered = !def.interactive && (!isLast || pc.redirect !== undefined);
      const out = buffered
        ? (t: string) => { buf += t; }
        : (t: string) => io.write(t);

      const ctx: ShellCtx = {
        args: globbed,
        flags,
        fs: this.fs,
        state: this.state,
        io,
        out,
        stdin,
        host,
        signal: io.signal(),
        sleep: (ms) => io.sleep(ms),
      };

      let code = 0;
      try {
        code = (await def.run(ctx)) ?? 0;
      } catch (err) {
        if (!io.signal().aborted) {
          io.writeln(RED + `${pc.name} : ${(err as Error).message ?? 'command failed'}` + RESET);
        }
        code = 1;
      }
      this.state.lastExit = code;

      if (buffered && pc.redirect) {
        const err = this.fs.write(pc.redirect.file, stripAnsi(buf), this.state.cwd, pc.redirect.append);
        if (err) {
          io.writeln(RED + `out-file : ${err}` + RESET);
          this.state.lastExit = 1;
        }
        stdin = undefined;
      } else if (buffered) {
        stdin = stripAnsi(buf);
      } else {
        stdin = undefined;
      }
    }
  }

  private commandNotFound(pc: ParsedCmd, io: TermIO): void {
    const name = pc.name;
    const full = [pc.name, ...pc.args].join(' ');
    io.write(
      RED +
      `${name} : The term '${name}' is not recognized as the name of a cmdlet, function, script file, or operable\n` +
      `program. Check the spelling of the name, or if a path was included, verify that the path is correct and try\n` +
      `again.\n` +
      `At line:1 char:1\n` +
      `+ ${full}\n` +
      `+ ${'~'.repeat(Math.max(2, name.length))}\n` +
      `    + CategoryInfo          : ObjectNotFound: (${name}:String) [], CommandNotFoundException\n` +
      `    + FullyQualifiedErrorId : CommandNotFoundException\n` +
      RESET,
    );
    // Natural-language input gets a friendly nudge toward the agents.
    if (pc.args.length >= 2 || full.endsWith('?')) {
      io.writeln(sgr.dim + 'Tip: that looks like a question — type ' + RESET + 'claude' +
        sgr.dim + ' (or ' + RESET + 'agents' + sgr.dim + ') to ask an AI.' + RESET);
    }
  }

  onIdleInterrupt(): void {
    /* PowerShell just shows a fresh prompt. */
  }

  complete(line: string, cursor: number): Completion | undefined {
    const before = line.slice(0, cursor);
    const boundary = Math.max(
      before.lastIndexOf(' '), before.lastIndexOf('|'), before.lastIndexOf(';'),
      before.lastIndexOf('>'), before.lastIndexOf('('),
    );
    const wordStart = boundary + 1;
    const word = before.slice(wordStart);
    const head = before.slice(0, wordStart).trim();
    const isFirstWord = head === '' || /[|;&]$/.test(head);

    if (isFirstWord) {
      const w = word.toLowerCase();
      const seen = new Set<string>();
      const items: string[] = [];
      for (const c of this.commandList) {
        if (c.hidden) continue;
        for (const n of [...(c.aliases ?? []), c.name]) {
          if (n.toLowerCase().startsWith(w) && !seen.has(n.toLowerCase())) {
            seen.add(n.toLowerCase());
            items.push(n);
          }
        }
      }
      items.sort((a, b) => a.length - b.length || a.localeCompare(b));
      return items.length ? { items, replaceStart: wordStart } : undefined;
    }

    // Path completion
    const norm = word.replace(/\//g, '\\');
    const lastSep = norm.lastIndexOf('\\');
    const dirPart = lastSep >= 0 ? norm.slice(0, lastSep + 1) : '';
    const prefix = (lastSep >= 0 ? norm.slice(lastSep + 1) : norm).toLowerCase();
    const entries = this.fs.list(dirPart || '.', this.state.cwd);
    if (!entries) return undefined;
    const items = entries
      .filter((e) => e.name.toLowerCase().startsWith(prefix))
      .map((e) => dirPart + e.name + (e.kind === 'dir' ? '\\' : ''));
    return items.length ? { items, replaceStart: wordStart } : undefined;
  }
}

/* ── arg helpers ──────────────────────────────────────────────────────── */

export function splitFlags(tokens: string[]): { args: string[]; flags: Set<string> } {
  const args: string[] = [];
  const flags = new Set<string>();
  for (const t of tokens) {
    if (/^-[A-Za-z?]/.test(t)) {
      const body = t.slice(1);
      if (/^[a-z]{1,3}$/.test(body)) {
        for (const ch of body) flags.add(ch);
      } else {
        flags.add(body.toLowerCase());
      }
    } else {
      args.push(t);
    }
  }
  return { args, flags };
}

export function expandGlobs(args: string[], fs: WinFS, cwd: string): string[] {
  const out: string[] = [];
  for (const arg of args) {
    if (!/[*?]/.test(arg)) { out.push(arg); continue; }
    const norm = arg.replace(/\//g, '\\');
    const lastSep = norm.lastIndexOf('\\');
    const dirPart = lastSep >= 0 ? norm.slice(0, lastSep + 1) : '';
    const pattern = lastSep >= 0 ? norm.slice(lastSep + 1) : norm;
    const re = new RegExp('^' +
      pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') +
      '$', 'i');
    const entries = fs.list(dirPart || '.', cwd) ?? [];
    const matches = entries.filter((e) => re.test(e.name)).map((e) => dirPart + e.name);
    if (matches.length) out.push(...matches);
    else out.push(arg);
  }
  return out;
}
