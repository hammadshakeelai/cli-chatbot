import type { Command, CommandContext, OutputChunk } from '../types';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export const cmatrixCommand: Command = {
  name: 'cmatrix',
  help: 'Simulate the display from "The Matrix". Ctrl-C to exit.',
  usage: 'cmatrix',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('cmatrix', ctx.vfs)) {
      yield "command not found: try apt install cmatrix\n";
      return;
    }

    const cols = Math.min(ctx.ui.cols, 80);
    const rows = Math.min(ctx.ui.rows, 24);

    // reduced-motion: just show a static preview
    if (ctx.ui.reducedMotion) {
      yield '\x1b[32m' + 'Matrix rain (static preview — reduced motion enabled)\n'.repeat(rows - 2) + '\x1b[0m';
      return;
    }

    // Hide cursor
    yield '\x1b[?25l';

    const drops: number[] = [];
    for (let i = 0; i < cols; i++) {
      drops[i] = Math.floor(Math.random() * -rows);
    }

    for (let frame = 0; frame < 300; frame++) {
      if (ctx.signal.aborted) break;

      let frameStr = '\x1b[H'; // home cursor

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dropY = drops[x] ?? 0;
          if (y === dropY) {
            frameStr += '\x1b[37m' + CHARS[Math.floor(Math.random() * CHARS.length)]!; // bright white head
          } else if (y > dropY && y < dropY + 4) {
            frameStr += '\x1b[32m' + CHARS[Math.floor(Math.random() * CHARS.length)]!; // green trail
          } else {
            frameStr += ' ';
          }
        }
        if (y < rows - 1) frameStr += '\n';
      }

      // Advance drops
      for (let x = 0; x < cols; x++) {
        drops[x] = (drops[x] ?? 0) + 1;
        if (drops[x]! >= rows) {
          drops[x] = Math.floor(Math.random() * -5);
        }
      }

      yield '\x1b[32m' + frameStr;
      await sleep(60, ctx.signal);
    }

    // Restore cursor + clear
    yield '\x1b[?25h\x1b[H\x1b[J';
  },
};
