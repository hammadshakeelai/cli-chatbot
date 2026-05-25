import type { Command, CommandContext, OutputChunk } from '../types';

const FAKE_LOGS = [
  'INFO: connecting to secure channel...',
  'DEBUG: handshake protocol v3.2 initiated',
  'WARN: nonce collision detected, renegotiating',
  'INFO: tunnel established (4096-bit AES-GCM)',
  'DEBUG: decrypting payload block 0xAF32',
  'INFO: injecting shellcode into target buffer',
  'WARN: stack canary mismatch, adjusting',
  'INFO: privilege escalation via CVE-2024-1234',
  'DEBUG: spawning reverse shell on port 8443',
  'INFO: exfiltrating /etc/passwd (encrypted)',
  'WARN: IDS evasion: fragmenting TCP stream',
  'INFO: ARP cache poisoning complete',
  'DEBUG: DNS tunneling active on 8.8.8.8:53',
  'INFO: heartbeat signal received from agent',
  'WARN: entropy pool running low, reseeding',
  'INFO: loading kernel module: rootkit.ko',
  'DEBUG: hiding process from /proc/',
  'INFO: MITM proxy intercepting on 0.0.0.0:8080',
  'WARN: certificate pinned, bypassing...',
  'INFO: all systems nominal. Awaiting commands.',
];

const KERNEL_PANIC = [
  '-----------[ Kernel Panic ]-----------',
  'Oops: 0002 [#1] SMP',
  'CPU: 0 PID: 1337 Comm: hollywood Tainted: G        W',
  'RIP: 0010:0xdeadbeefcafe0001',
  'RSP: 0000:ffff8880137fbd98  EFLAGS: 00010246',
  'Stack:  ffff8880137fbe00 ffffffff8135a0e1',
  '         ffff8880137fbe10 ffffffff810e7b41',
  'Call Trace:',
  '  <TASK>',
  '  ? show_stack+0x52/0x60',
  '  ? dump_stack_lvl+0x4a/0x80',
  '  ? dump_stack+0x10/0x20',
  '  ? panic+0x1c4/0x3c0',
  '  ? hollywood_drama+0xff/0x130',
  '  ? syscall_handler+0x5c/0x80',
  '  ? do_syscall_64+0x3c/0x90',
  '  ? entry_SYSCALL_64_after_hwframe+0x72/0xdc',
  '  </TASK>',
  '--------------------------------------',
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export const hollywoodCommand: Command = {
  name: 'hollywood',
  help: 'Fill your terminal with Hollywood-style hacking melodrama. Ctrl-C to exit.',
  usage: 'hollywood',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('hollywood', ctx.vfs)) {
      yield "command not found: try apt install hollywood\n";
      return;
    }

    const rows = Math.min(ctx.ui.rows, 24);

    if (ctx.ui.reducedMotion) {
      yield '\x1b[33m' + 'Hollywood hacking simulation (static preview — reduced motion enabled)\n' + '\x1b[0m';
      for (let i = 0; i < rows - 3; i++) {
        yield FAKE_LOGS[Math.floor(Math.random() * FAKE_LOGS.length)]! + '\n';
      }
      yield '\x1b[31m' + 'TASK KILLED (signal 9)\n' + '\x1b[0m';
      return;
    }

    yield '\x1b[?25l\x1b[2J\x1b[H';
    yield '\x1b[31m' + '*** HOLLYWOOD HACK SEQUENCE ***\x1b[0m\n';

    const panicAt = 60 + Math.floor(Math.random() * 40);

    for (let frame = 0; frame < 120; frame++) {
      if (ctx.signal.aborted) break;

      if (frame === panicAt) {
        for (const line of KERNEL_PANIC) {
          yield '\x1b[31m' + line + '\x1b[0m\n';
          if (ctx.signal.aborted) break;
          await sleep(120, ctx.signal);
        }
        break;
      }

      const linesToScroll = Math.min(rows - 2, FAKE_LOGS.length);
      // Scroll output: clear and redraw
      let block = '';
      for (let i = 0; i < linesToScroll; i++) {
        const idx = (frame + i) % FAKE_LOGS.length;
        const log = FAKE_LOGS[idx]!;
        const color = log.startsWith('INFO') ? '\x1b[36m' : log.startsWith('WARN') ? '\x1b[33m' : '\x1b[32m';
        block += color + log + '\x1b[0m';

        // Random hex bytes
        if (Math.random() < 0.3) {
          block += '  ' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ');
        }
        block += '\n';
      }

      yield '\x1b[H' + block;
      await sleep(150, ctx.signal);
    }

    yield '\x1b[?25h';
  },
};
