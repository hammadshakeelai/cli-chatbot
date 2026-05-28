import type { Command, CommandContext, OutputChunk } from '../types';

const COLORS = [
  '\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m', '\x1b[37m',
];
const RESET = '\x1b[0m';

// Flying objects — each is an array of ASCII art frames (one array of strings per frame)
const OBJECTS = [
  // Rotating Cube (6 frames)
  [
    [
      '    +-------+',
      '   /       /|',
      '  +-------+ |',
      '  |       | +',
      '  |       |/',
      '  +-------+',
    ],
    [
      '    +-------+',
      '   /       /|',
      '  +-------+ |',
      '  |   x   | +',
      '  |       |/',
      '  +-------+',
    ],
    [
      '    +-------+',
      '   /   o   /|',
      '  +-------+ |',
      '  |       | +',
      '  |       |/',
      '  +-------+',
    ],
    [
      '    +-------+',
      '   /       /|',
      '  +-------+ |',
      '  |   O   | +',
      '  |       |/',
      '  +-------+',
    ],
    [
      '    +-------+',
      '   /   @   /|',
      '  +-------+ |',
      '  |       | +',
      '  |       |/',
      '  +-------+',
    ],
    [
      '    +-------+',
      '   /       /|',
      '  +-------+ |',
      '  |  ***  | +',
      '  |       |/',
      '  +-------+',
    ],
  ],
  // Bouncing Ball (4 frames)
  [
    [
      '   ___ ',
      '  /   \\',
      ' |  () |',
      '  \\___/',
    ],
    [
      '   ___ ',
      '  /   \\',
      ' | (O) |',
      '  \\___/',
    ],
    [
      '   ___ ',
      '  /   \\',
      ' | OO  |',
      '  \\___/',
    ],
    [
      '   ___ ',
      '  /   \\',
      ' |  () |',
      '  \\___/',
    ],
  ],
  // Flying Saucer (4 frames)
  [
    [
      '     .-.      ',
      '    (   )     ',
      '     `-\\      ',
      '    /   \\    ',
      '   /     \\   ',
    ],
    [
      '      .-.     ',
      '     (   )    ',
      '      `-\\     ',
      '     /   \\   ',
      '    /     \\  ',
    ],
    [
      '       .-.    ',
      '      (   )   ',
      '       `-\\    ',
      '      /   \\  ',
      '     /     \\ ',
    ],
    [
      '      .-.     ',
      '     (   )   ',
      '      `-\\     ',
      '     /   \\   ',
      '    /     \\  ',
    ],
  ],
  // Spinning Diamond (4 frames)
  [
    [
      '    /\\    ',
      '   /  \\   ',
      '  /    \\  ',
      '  \\    /  ',
      '   \\  /   ',
      '    \\/    ',
    ],
    [
      '   /\\   ',
      '  /  \\  ',
      ' /    \\ ',
      ' \\    / ',
      '  \\  /  ',
      '   \\/   ',
    ],
    [
      '  /\\  ',
      ' /  \\ ',
      '/    \\',
      '\\    /',
      ' \\  / ',
      '  \\/  ',
    ],
    [
      '   /\\   ',
      '  /  \\  ',
      ' /    \\ ',
      ' \\    / ',
      '  \\  /  ',
      '   \\/   ',
    ],
  ],
  // Star (2 frames)
  [
    [
      '    *    ',
      ' *     * ',
      '  *   *  ',
      '   * *   ',
      '    *    ',
    ],
    [
      '    *    ',
      '  *   *  ',
      '    *    ',
      '  *   *  ',
      '    *    ',
    ],
  ],
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

interface FlyingObj {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  objIndex: number;
  frame: number;
  speed: number;
}

export const bbCommand: Command = {
  name: 'bb',
  help: 'Classic flying ASCII art demo. Watch cubes, balls, saucers, diamonds, and stars fly across your terminal. Ctrl-C to exit.',
  usage: 'bb',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('bb', ctx.vfs)) {
      yield "command not found: try apt install bb\n";
      return;
    }

    const cols = Math.min(ctx.ui.cols, 80);
    const rows = Math.min(ctx.ui.rows, 24);

    if (ctx.ui.reducedMotion) {
      yield '\x1b[36mBB \u2014 Flying ASCII Art Demo (static preview \u2014 reduced motion enabled)\x1b[0m\n';
      for (let o = 0; o < OBJECTS.length; o++) {
        const color = COLORS[o % COLORS.length]!;
        const frame = OBJECTS[o]![0]!;
        for (const line of frame) {
          yield color + '  ' + line + RESET + '\n';
        }
        yield '\n';
      }
      return;
    }

    yield '\x1b[?25l\x1b[2J\x1b[H';

    // Spawn initial flying objects
    const flying: FlyingObj[] = [];
    for (let i = 0; i < 3; i++) {
      const obj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]!;
      const fw = obj[0]![0]!.length;
      flying.push({
        x: Math.floor(Math.random() * (cols - fw)),
        y: Math.floor(Math.random() * (rows - obj.length)),
        dx: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)),
        dy: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        objIndex: i % OBJECTS.length,
        frame: 0,
        speed: 80 + Math.floor(Math.random() * 40),
      });
    }

    let frameCount = 0;

    for (let frame = 0; frame < 500; frame++) {
      if (ctx.signal.aborted) break;

      // Occasionally spawn a new object
      if (flying.length < 8 && Math.random() < 0.015) {
        const objIdx = Math.floor(Math.random() * OBJECTS.length);
        const obj = OBJECTS[objIdx]!;
        const fw = obj[0]![0]!.length;
        const fh = obj.length;
        flying.push({
          x: Math.floor(Math.random() < 0.5 ? 0 : cols - fw - 1),
          y: Math.floor(Math.random() * (rows - fh)),
          dx: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)),
          dy: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)),
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          objIndex: objIdx,
          frame: 0,
          speed: 60 + Math.floor(Math.random() * 60),
        });
      }

      // Build frame: clear and redraw all objects
      let frameStr = '\x1b[H';

      // Create a canvas
      const canvas: string[][] = [];
      for (let y = 0; y < rows; y++) {
        canvas[y] = [];
        for (let x = 0; x < cols; x++) {
          canvas[y]![x] = ' ';
        }
      }

      // Draw each flying object onto the canvas
      for (let o = 0; o < flying.length; o++) {
        const f = flying[o]!;
        const obj = OBJECTS[f.objIndex]!;
        const objFrames = obj;
        const currentFrame = objFrames[f.frame % objFrames.length]!;
        const fh = currentFrame.length;
        const fw = Math.max(...currentFrame.map((l) => l.length));

        // Update position
        f.x += f.dx;
        f.y += f.dy;

        // Bounce off walls
        if (f.x <= 0 || f.x + fw >= cols) {
          f.dx = -f.dx;
          f.x = Math.max(0, Math.min(f.x, cols - fw - 1));
        }
        if (f.y <= 0 || f.y + fh >= rows) {
          f.dy = -f.dy;
          f.y = Math.max(0, Math.min(f.y, rows - fh));
        }

        // Animate frame
        if (frameCount % f.speed === 0) {
          f.frame++;
        }

        // Draw onto canvas
        for (let ly = 0; ly < fh; ly++) {
          const line = currentFrame[ly]!;
          const cy = f.y + ly;
          if (cy < 0 || cy >= rows) continue;
          for (let lx = 0; lx < line.length; lx++) {
            const cx = f.x + lx;
            if (cx < 0 || cx >= cols) continue;
            const ch = line[lx]!;
            if (ch !== ' ') {
              canvas[cy]![cx] = f.color + ch + RESET;
            }
          }
        }
      }

      // Render canvas
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = canvas[y]![x]!;
          if (cell === ' ') {
            frameStr += ' ';
          } else {
            frameStr += cell;
          }
        }
        if (y < rows - 1) frameStr += '\n';
      }

      yield frameStr;
      frameCount++;
      await sleep(100, ctx.signal);
    }

    yield '\x1b[?25h\x1b[H\x1b[J';
  },
};
