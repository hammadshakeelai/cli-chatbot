import type { Command, CommandContext, OutputChunk } from '../types';

const CHARACTERS: Record<string, string[]> = {
  cow: [
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ],
  dragon: [
    '                \\                    /',
    '                 \\  _________       /',
    '                  \\/   _____  \\   _/',
    '                   \\  (o)   (o) /',
    '                    \\  ___  ___/',
    '                     \\/  \\/ ',
    '    ___________      //\\\\',
    '   /           \\    //  \\\\',
    '  |  ROAR!     |  //    \\\\',
    '   \\___________/ //______\\\\',
  ],
  tux: [
    '   \\',
    '    \\',
    '        .--.',
    '       |o_o |',
    '       |:_/ |',
    '      //   \\ \\',
    '     (|     | )',
    '    / \\_   _/ \\',
    '    \\___)=(___/',
  ],
  cheese: [
    '       \\',
    '        \\',
    '    __  ',
    '   / _)\\',
    '  / /__',
    ' /___/',
    ' (___)',
    '  `´',
  ],
  stegosaurus: [
    '                         \\',
    '                          \\',
    '    __                   ',
    '   / _)\\      /\\\\/\\\\/\\\\/\\\\',
    '  / /__\\_____//___________',
    ' /____________/           \\',
    '(___)       (_____________／',
  ],
};

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
  help: 'Display a configurable character saying text. Usage: cowsay [-f character] <text>',
  usage: 'cowsay [-f cow|dragon|tux|cheese|stegosaurus] <text>',
  async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
    const { isAppUnlocked } = await import('../apt/installer');
    if (!isAppUnlocked('cowsay', ctx.vfs)) {
      yield "command not found: try apt install cowsay\n";
      return;
    }

    const args = [...ctx.args];
    let character = 'cow';

    // Parse -f flag
    if (args[0] === '-f' && args[1]) {
      args.shift(); // remove -f
      const name = args.shift()!.toLowerCase();
      if (CHARACTERS[name]) {
        character = name;
      } else {
        yield `Unknown character: ${name}. Available: ${Object.keys(CHARACTERS).join(', ')}\n`;
        return;
      }
    }

    const text = args.join(' ') || 'Moo!';
    const art = CHARACTERS[character]!;
    const bubbleLines = bubble(text);

    for (const bl of bubbleLines) {
      yield bl + '\n';
    }
    for (const line of art) {
      yield line + '\n';
    }
  },
};
