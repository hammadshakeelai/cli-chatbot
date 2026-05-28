import type { Command, CommandContext, OutputChunk } from '../types';

const COLORS = [
  '\x1b[31m', // red
  '\x1b[33m', // yellow
  '\x1b[32m', // green
  '\x1b[36m', // cyan
  '\x1b[34m', // blue
  '\x1b[35m', // magenta
];
const RESET = '\x1b[0m';

interface Segment {
  x: number;
  y: number;
  dir: number; // 0=right, 1=down, 2=left, 3=up
  color: string;
  turnCount: number;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

/** Get the pipe character for entering/exiting given directions.
 *  entryDir: direction we're coming FROM (opposite of movement dir)
 *  exitDir: direction we're going TO (movement dir)
 */
function pipeChar(entryDir: number, exitDir: number): string {
  const bit = (1 << entryDir) | (1 << exitDir);
  switch (bit) {
    case (1 << 0) | (1 << 2): return '─'; // right + left (horizontal)
    case (1 << 1) | (1 << 3): return '│'; // bottom + top (vertical)
    case (1 << 0) | (1 << 1): return '┌'; // right + bottom
    case (1 << 1) | (1 << 2): return '┐'; // bottom + left
    case (1 << 2) | (1 << 3): return '┘'; // left + top
    case (1 << 0) | (1 << 3): return '└'; // right + top
    default: return '┼';
  }
}

export const pipesCommand: Command = {
  name: 'pipes',
  help: 'Classic pipes terminal screensaver. Ctrl-C to exit.',
  usage: 'pipes',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('pipes', ctx.vfs)) {
      yield "command not found: try apt install pipes\n";
      return;
    }

    const cols = Math.min(ctx.ui.cols, 80);
    const rows = Math.min(ctx.ui.rows, 24);

    if (ctx.ui.reducedMotion) {
      yield '\x1b[36m' + 'Pipes screensaver (static preview — reduced motion enabled)\x1b[0m\n';
      // Draw a simple static pipe pattern
      for (let y = 0; y < Math.min(rows - 2, 8); y++) {
        const color = COLORS[y % COLORS.length]!;
        yield color + ' ───┐ ┌──────┐ ┌─┐ ┌───\n';
        yield color + '    │ └──┐   │ │ │ │\n';
      }
      yield RESET;
      return;
    }

    // Hide cursor and clear
    yield '\x1b[?25l\x1b[2J\x1b[H';

    // Grid: store the pipe character at each cell
    const grid: Array<Array<{ char: string; color: string } | null>> = [];
    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      for (let x = 0; x < cols; x++) {
        grid[y]![x] = null;
      }
    }

    // Start with a few pipes
    const segments: Segment[] = [];
    for (let i = 0; i < Math.min(5, cols); i++) {
      segments.push({
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        dir: Math.floor(Math.random() * 4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        turnCount: 0,
      });
    }

    for (let frame = 0; frame < 500; frame++) {
      if (ctx.signal.aborted) break;

      // Move each segment
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s]!;

        // Record the pipe character at current position (before moving)
        if (seg.x >= 0 && seg.x < cols && seg.y >= 0 && seg.y < rows) {
          // The character depends on what's already there and the new direction
          const existing = grid[seg.y]![seg.x];
          if (existing) {
            // If we revisit a cell, it becomes a cross or intersection
            grid[seg.y]![seg.x] = { char: '┼', color: seg.color };
          }
        }

        // Choose new direction
        const turnChance = 0.15 + (seg.turnCount > 10 ? 0.1 : 0);
        let newDir = seg.dir;

        if (Math.random() < turnChance) {
          // Turn left or right
          newDir = Math.random() < 0.5
            ? (seg.dir + 1) % 4   // turn right
            : (seg.dir + 3) % 4;  // turn left
          seg.turnCount++;
        }

        // Calculate new position
        let nx = seg.x;
        let ny = seg.y;
        switch (newDir) {
          case 0: nx++; break; // right
          case 1: ny++; break; // down
          case 2: nx--; break; // left
          case 3: ny--; break; // up
        }

        // Bounce off edges
        if (nx < 0) { nx = 0; newDir = 0; }
        if (nx >= cols) { nx = cols - 1; newDir = 2; }
        if (ny < 0) { ny = 0; newDir = 1; }
        if (ny >= rows) { ny = rows - 1; newDir = 3; }

        // Place pipe character at the OLD position (where we're leaving from)
        if (seg.x >= 0 && seg.x < cols && seg.y >= 0 && seg.y < rows) {
          const entryDir = (seg.dir + 2) % 4; // opposite of where we came from
          const exitDir = newDir;
          const ch = pipeChar(entryDir, exitDir);
          grid[seg.y]![seg.x] = { char: ch, color: seg.color };
        }

        // Jump to new position
        seg.dir = newDir;
        seg.x = nx;
        seg.y = ny;
      }

      // Occasionally add a new segment
      if (segments.length < 15 && Math.random() < 0.02) {
        segments.push({
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
          dir: Math.floor(Math.random() * 4),
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          turnCount: 0,
        });
      }

      // Render frame
      let frameStr = '\x1b[H';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y]![x];
          if (cell) {
            frameStr += cell.color + cell.char + RESET;
          } else {
            frameStr += ' ';
          }
        }
        if (y < rows - 1) frameStr += '\n';
      }

      yield frameStr;
      await sleep(80, ctx.signal);
    }

    // Restore cursor and clear
    yield '\x1b[?25h\x1b[H\x1b[J';
  },
};
