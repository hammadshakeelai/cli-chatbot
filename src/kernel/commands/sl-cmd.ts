import type { Command, CommandContext, OutputChunk } from '../types';

const TRAIN = [
  '      ====        ________                ___________ ',
  '  _D _|  |_______/        \\__I_I_____===__|_________| ',
  '   |(_)---  |   H           \\___________ |   |        |',
  '   /     |  |   H  |__|     |           \\ |___|_____/|',
  '  |      |  |          H   |___________   |___|___|__/_',
  '  \\______|--._______.--.___|    (H)_______/-----------',
  '   |/\\n   |         | |   |  |\\\\n   |  |   |  |   |  |',
  '  ======|__|==========|__|======|__|=====H============',
  '  ~~~~~~  ~~~~~~  ~~~~~~  ~~~~~~  ~~~~~~  ~~~~~~  ~~~~~',
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export const slCommand: Command = {
  name: 'sl',
  help: 'Steam locomotive runs across your terminal. Ctrl-C to exit.',
  usage: 'sl',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('sl', ctx.vfs)) {
      yield "command not found: try apt install sl\n";
      return;
    }

    const cols = Math.min(ctx.ui.cols, 80);
    const trainLen = TRAIN[0]!.length;

    if (ctx.ui.reducedMotion) {
      yield '🚂 Choo choo! (reduced motion — static preview)\n';
      for (const line of TRAIN) {
        yield '\x1b[33m' + line + '\x1b[0m\n';
      }
      return;
    }

    yield '\x1b[?25l';

    const maxOffset = cols + trainLen;
    for (let offset = 0; offset < maxOffset; offset++) {
      if (ctx.signal.aborted) break;

      let frameStr = '';
      for (const line of TRAIN) {
        const padding = '.'.repeat(Math.max(0, cols - (maxOffset - offset)));
        const visible = line.slice(0, cols);
        frameStr += '\x1b[33m' + padding + visible + '\x1b[0m\n';
      }

      yield '\x1b[H' + frameStr;
      await sleep(80, ctx.signal);
    }

    yield '\x1b[?25h\x1b[H\x1b[J';
  },
};
