import type { Command, CommandContext, OutputChunk } from './types';

/** Wrap a command so its module is lazy-imported on first execution. */
function lazy(
  name: string,
  help: string,
  usage: string | undefined,
  loader: () => Promise<Command>,
): Command {
  return {
    name,
    help,
    usage,
    async *run(ctx: CommandContext): AsyncIterable<OutputChunk> {
      const realCmd = await loader();
      yield* realCmd.run(ctx);
    },
  };
}

/** Screensaver/animated/gimmick commands that don't need to load on startup. */
export const lazyCommands: Command[] = [
  lazy('bb',      'Classic flying ASCII art demo. Ctrl-C to exit.',           'bb',      () => import('./commands/bb-cmd').then((m) => m.bbCommand)),
  lazy('pipes',   'Classic pipes terminal screensaver. Ctrl-C to exit.',      'pipes',   () => import('./commands/pipes-cmd').then((m) => m.pipesCommand)),
  lazy('cmatrix', 'Simulate the display from "The Matrix". Ctrl-C to exit.',  'cmatrix', () => import('./commands/cmatrix-cmd').then((m) => m.cmatrixCommand)),
  lazy('hollywood','Fill your terminal with Hollywood-style hacking drama.',   'hollywood',() => import('./commands/hollywood-cmd').then((m) => m.hollywoodCommand)),
  lazy('neofetch','Show system information and logo.',                           'neofetch', () => import('./commands/neofetch').then((m) => m.neofetchCommand)),
  lazy('figlet',  'Display large characters from ASCII text.',                 'figlet <text>',  () => import('./commands/figlet-cmd').then((m) => m.figletCommand)),
  lazy('toilet',  'Display large ASCII text with color and border flair.',     'toilet [options] <text>', () => import('./commands/toilet-cmd').then((m) => m.toiletCommand)),
  lazy('cowsay',  'Display a message in a speech bubble from a cow.',          'cowsay <text>',  () => import('./commands/cowsay-cmd').then((m) => m.cowsayCommand)),
  lazy('fortune', 'Display a random fortune / wisdom.',                          'fortune',        () => import('./commands/fortune-cmd').then((m) => m.fortuneCommand)),
  lazy('sl',      'Display a steam locomotive animation. Ctrl-C to exit.',     'sl',             () => import('./commands/sl-cmd').then((m) => m.slCommand)),
  lazy('nyancat', 'Rainbow cat with poptart. Ctrl-C to exit.',                  'nyancat',        () => import('./commands/nyancat-cmd').then((m) => m.nyancatCommand)),
];
