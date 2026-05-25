import type { Command, CommandContext, OutputChunk } from '../types';

const COW = [
  '        \\   ^__^',
  '         \\  (oo)\\_______',
  '            (__)\\       )\\/\\',
  '                ||----w |',
  '                ||     ||',
];

function bubble(text: string): string[] {
  const lines = text.split('\n');
  const width = Math.max(...lines.map((l) => l.length), 1);
  const top = ' ' + '_'.repeat(width + 2);
  const bottom = ' ' + '-'.repeat(width + 2);
  const result = [top];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const pad = ' '.repeat(width - line.length);
    if (lines.length === 1) {
      result.push(`< ${line}${pad} >`);
    } else if (i === 0) {
      result.push(`/ ${line}${pad} \\`);
    } else if (i === lines.length - 1) {
      result.push(`\\ ${line}${pad} /`);
    } else {
      result.push(`| ${line}${pad} |`);
    }
  }

  result.push(bottom);
  return result;
}

export const cowsayCommand: Command = {
  name: 'cowsay',
  help: 'Display a configurable cow saying text. Usage: cowsay <text>',
  usage: 'cowsay <text>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('cowsay', ctx.vfs)) {
      yield "command not found: try apt install cowsay\n";
      return;
    }

    const text = ctx.args.join(' ') || 'Moo!';
    const bubbleLines = bubble(text);

    for (const bl of bubbleLines) {
      yield bl + '\n';
    }
    for (const cowLine of COW) {
      yield cowLine + '\n';
    }
  },
};
