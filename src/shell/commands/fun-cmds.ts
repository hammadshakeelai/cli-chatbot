import figlet from 'figlet';
import standardFont from 'figlet/importable-fonts/Standard.js';
import type { ShellCommand, ShellCtx } from '../types';
import { sgr, RESET, fgHex, gradientLines } from '@/term/ansi';
import { APP_NAME, APP_VERSION, HOST_NAME, USER_NAME } from '@/lib/constants';
import { MIRAGE_ART } from '@/agents/ascii';

let figletReady = false;
function ensureFiglet(): void {
  if (!figletReady) {
    figlet.parseFont('Standard', standardFont);
    figletReady = true;
  }
}

const SESSION_START = Date.now();

export const winFetch: ShellCommand = {
  name: 'winfetch',
  aliases: ['neofetch'],
  description: 'Show system info with the Windows logo',
  run(ctx: ShellCtx) {
    const B = fgHex('#4cc2ff');
    const C = fgHex('#0078d4');
    const block = '████████';
    const logo = [
      `${C}${block}  ${B}${block}`,
      `${C}${block}  ${B}${block}`,
      `${C}${block}  ${B}${block}`,
      `${C}${block}  ${B}${block}`,
      '',
      `${B}${block}  ${C}${block}`,
      `${B}${block}  ${C}${block}`,
      `${B}${block}  ${C}${block}`,
      `${B}${block}  ${C}${block}`,
    ];
    const upMin = Math.max(1, Math.floor((Date.now() - SESSION_START) / 60000));
    const A = sgr.brightCyan;
    const info = [
      `${A}${USER_NAME}@${HOST_NAME}${RESET}`,
      `${sgr.dim}${'─'.repeat(24)}${RESET}`,
      `${A}OS:${RESET} Windows 11 Pro (build 26100)`,
      `${A}Host:${RESET} ${APP_NAME} v${APP_VERSION}`,
      `${A}Kernel:${RESET} 10.0.26100 (simulated)`,
      `${A}Uptime:${RESET} ${upMin} minute${upMin === 1 ? '' : 's'}`,
      `${A}Shell:${RESET} PowerShell 5.1.26100`,
      `${A}Resolution:${RESET} ${ctx.io.cols()}x${ctx.io.rows()} cells`,
      `${A}CPU:${RESET} Imagination Core i9 (16) @ 5.0GHz`,
      `${A}GPU:${RESET} Suspension of Disbelief RTX`,
      `${A}Memory:${RESET} 0 MiB / ∞ MiB (it's a browser tab)`,
    ];
    const lines: string[] = [''];
    const rows = Math.max(logo.length, info.length);
    for (let i = 0; i < rows; i++) {
      const left = logo[i] ?? '';
      const leftVis = left ? 18 : 0;
      lines.push('  ' + (left || '') + RESET + ' '.repeat(Math.max(1, 22 - leftVis)) + (info[i] ?? ''));
    }
    lines.push('');
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const figletCmd: ShellCommand = {
  name: 'figlet',
  description: 'Render text as large ASCII art',
  usage: 'figlet <text>',
  run(ctx: ShellCtx) {
    const text = ctx.args.join(' ') || (ctx.stdin ?? '').trim();
    if (!text) { ctx.out('Usage: figlet <text>\n'); return 1; }
    ensureFiglet();
    try {
      const art = figlet.textSync(text.slice(0, 24), { font: 'Standard' });
      ctx.out(art.replace(/[ \t]+$/gm, '') + '\n');
      return 0;
    } catch {
      ctx.out('figlet: could not render text\n');
      return 1;
    }
  },
};

export const cowSay: ShellCommand = {
  name: 'cowsay',
  description: 'A cow says things',
  usage: 'cowsay <text>',
  run(ctx: ShellCtx) {
    const text = (ctx.args.join(' ') || (ctx.stdin ?? '').trim() || 'Moo?').slice(0, 200);
    const width = Math.min(38, Math.max(4, text.length));
    const words = text.split(/\s+/);
    const rows: string[] = [];
    let cur = '';
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > width) { rows.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) rows.push(cur);
    const w = Math.max(...rows.map((r) => r.length));
    const lines: string[] = [];
    lines.push(' ' + '_'.repeat(w + 2));
    if (rows.length === 1) {
      lines.push(`< ${rows[0]!.padEnd(w)} >`);
    } else {
      rows.forEach((r, i) => {
        const [l, rr] = i === 0 ? ['/', '\\'] : i === rows.length - 1 ? ['\\', '/'] : ['|', '|'];
        lines.push(`${l} ${r.padEnd(w)} ${rr}`);
      });
    }
    lines.push(' ' + '-'.repeat(w + 2));
    lines.push('        \\   ^__^');
    lines.push('         \\  (oo)\\_______');
    lines.push('            (__)\\       )\\/\\');
    lines.push('                ||----w |');
    lines.push('                ||     ||');
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const lolCat: ShellCommand = {
  name: 'lolcat',
  description: 'Rainbow-colorize text (pipe into it)',
  usage: '<command> | lolcat',
  run(ctx: ShellCtx) {
    const text = ctx.stdin ?? ctx.args.join(' ');
    if (!text) { ctx.out('Usage: echo hi | lolcat\n'); return 1; }
    let out = '';
    let hue = 0;
    for (const line of text.split('\n')) {
      hue += 12;
      let h = hue;
      for (const ch of line) {
        if (ch !== ' ') out += fgHex(hsl(h % 360)) + ch;
        else out += ch;
        h += 3;
      }
      out += RESET + '\n';
    }
    ctx.out(out.slice(0, -1) + (text.endsWith('\n') ? '' : '\n'));
    return 0;
  },
};

function hsl(h: number): string {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = 0.5 * Math.min(Math.max(Math.min(k - 3, 9 - k), -1), 1);
    return Math.round((0.62 + c) * 255);
  };
  return `#${[f(0), f(8), f(4)].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')}`;
}

export const cMatrix: ShellCommand = {
  name: 'cmatrix',
  aliases: ['matrix'],
  description: 'The matrix rain (Esc or Ctrl+C to stop)',
  interactive: true,
  async run(ctx: ShellCtx) {
    const io = ctx.io;
    const cols = io.cols();
    const rows = io.rows();
    const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEFZ$#*+=-<>';
    const nCols = Math.floor(cols / 2);
    const drops = Array.from({ length: nCols }, () => ({
      y: Math.floor(Math.random() * -rows),
      speed: 0.4 + Math.random() * 0.8,
      len: 4 + Math.floor(Math.random() * (rows / 2)),
    }));
    const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

    io.term.write('\x1b[?25l\x1b[2J');
    try {
      while (!ctx.signal.aborted) {
        let frame = '';
        for (let i = 0; i < nCols; i++) {
          const d = drops[i]!;
          d.y += d.speed;
          const head = Math.floor(d.y);
          const x = i * 2 + 1;
          if (head >= 1 && head <= rows) {
            frame += `\x1b[${head};${x}H\x1b[1;97m${pick()}`;
          }
          const mid = head - 1;
          if (mid >= 1 && mid <= rows) frame += `\x1b[${mid};${x}H\x1b[92m${pick()}`;
          const dim = head - Math.floor(d.len / 2);
          if (dim >= 1 && dim <= rows) frame += `\x1b[${dim};${x}H\x1b[32m${pick()}`;
          const tail = head - d.len;
          if (tail >= 1 && tail <= rows) frame += `\x1b[${tail};${x}H `;
          if (tail > rows) {
            d.y = Math.floor(Math.random() * -20);
            d.len = 4 + Math.floor(Math.random() * (rows / 2));
            d.speed = 0.4 + Math.random() * 0.8;
          }
        }
        io.term.write(frame + RESET);
        await ctx.sleep(66);
      }
    } finally {
      io.term.write('\x1b[0m\x1b[2J\x1b[H\x1b[?25h');
    }
    return 0;
  },
};

export const mirageCmd: ShellCommand = {
  name: 'mirage',
  description: 'Print the Mirage Terminal banner',
  usage: 'mirage [--banner | --version | --help]',
  run(ctx: ShellCtx) {
    const has = (long: string, short?: string) =>
      ctx.args.some((a) => a.toLowerCase() === '--' + long) ||
      ctx.flags.has(long) || (short ? ctx.flags.has(short) : false);

    if (has('help', 'h')) {
      ctx.out(
        `\n  ${sgr.bold}${APP_NAME}${RESET} ${sgr.dim}— a PowerShell that isn't there${RESET}\n\n` +
        `  Usage: mirage [option]\n` +
        `    ${sgr.bold}--banner${RESET}     show the Mirage wordmark (default)\n` +
        `    ${sgr.bold}--version${RESET}    print the version\n` +
        `    ${sgr.bold}--help${RESET}       show this help\n\n`,
      );
      return 0;
    }

    if (has('version', 'v')) {
      ctx.out(`${APP_NAME} v${APP_VERSION}\n`);
      return 0;
    }

    // default + --banner
    const art = gradientLines(MIRAGE_ART, '#4cc2ff', '#c586ff');
    const lines = [
      '',
      ...art.map((l) => '  ' + l),
      '  ' + sgr.dim + `a PowerShell that isn't there · v${APP_VERSION}` + RESET,
      '',
      '  ' + sgr.dim + 'Type ' + RESET + 'agents' + sgr.dim + ' to meet the AI CLIs · ' +
        RESET + 'help' + sgr.dim + ' for everything else.' + RESET,
      '',
    ];
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
};

export const FUN_COMMANDS: ShellCommand[] = [winFetch, figletCmd, cowSay, lolCat, cMatrix, mirageCmd];
