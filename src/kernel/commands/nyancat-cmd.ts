import type { Command, CommandContext, OutputChunk } from '../types';

const NYAN_CAT = [
  '    ,,,',
  '   /_   \\_____',
  '  ( Nyan )----{)======>',
  '   \\_   /     ~~~~~',
  '    `\'\'',
];

const RAINBOW = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m'];
const RESET = '\x1b[0m';

const POP_TART = [
  '  ___________',
  ' /___   ___  \\',
  '|  \\\\| |//  |',
  '|   \\\\|//   |',
  ' \\_________/',
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export const nyancatCommand: Command = {
  name: 'nyancat',
  help: 'Rainbow cat with poptart. Ctrl-C to exit.',
  usage: 'nyancat',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('nyancat', ctx.vfs)) {
      yield "command not found: try apt install nyancat\n";
      return;
    }

    const cols = Math.min(ctx.ui.cols, 80);

    if (ctx.ui.reducedMotion) {
      yield '🌈 Nyan Cat! (reduced motion — static preview)\n';
      for (const line of NYAN_CAT) {
        yield RAINBOW[0] + '  ' + line + RESET + '\n';
      }
      return;
    }

    yield '\x1b[?25l';

    for (let frame = 0; frame < 200; frame++) {
      if (ctx.signal.aborted) break;

      const offset = frame % cols;
      const rainbowIdx = frame % RAINBOW.length;

      // Rainbow trail
      let frameStr = '';
      for (let r = 0; r < 3; r++) {
        const color = RAINBOW[(rainbowIdx + r) % RAINBOW.length]!;
        const dashLen = Math.max(0, offset - r * 4);
        const dash = '='.repeat(dashLen);
        frameStr += ' '.repeat(Math.max(0, offset - dashLen - r * 2)) + color + dash + RESET + '\n';
      }

      // Cat + poptart
      const catOffset = offset;
      for (let i = 0; i < NYAN_CAT.length; i++) {
        const catLine = i === 2 ? POP_TART[2]! + NYAN_CAT[i] : ' '.repeat(12) + NYAN_CAT[i]!;
        frameStr += ' '.repeat(catOffset) + catLine + '\n';
      }

      yield '\x1b[H' + frameStr;
      await sleep(100, ctx.signal);
    }

    yield '\x1b[?25h\x1b[H\x1b[J';
  },
};
