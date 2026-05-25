import type { Command, CommandContext, OutputChunk } from '../types';
import { APP_VERSION } from '@/lib/constants';

export const neofetchCommand: Command = {
  name: 'neofetch',
  help: 'Show system information and logo.',
  usage: 'neofetch',
  async *run(_ctx: CommandContext): AsyncIterable<OutputChunk> {
    const logo = [
      '        _________________________',
      '       |  ___________________  |',
      '       | |                   | |',
      '       | |    M I R A G E    | |',
      '       | |    virtual term   | |',
      '       | |___________________| |',
      '       |_______________________|',
      '          \\===============/',
    ];

    const os = 'Mirage OS';
    const host = 'Browser (WebAssembly)';
    const kernel = 'Mirage ' + APP_VERSION;
    const uptimeDays = Math.floor((Date.now() - 1630000000000) / 86400000);
    const packages = '0 (simulated)';
    const shell = 'mirage ' + APP_VERSION;
    const terminal = 'xterm.js';
    const cpu = 'MirageChip M1 (emulated)';
    const memory = '512MB / 1024MB';

    const info = [
      `OS: ${os}`,
      `Host: ${host}`,
      `Kernel: ${kernel}`,
      `Uptime: ${uptimeDays} days`,
      `Packages: ${packages}`,
      `Shell: ${shell}`,
      `Terminal: ${terminal}`,
      `CPU: ${cpu}`,
      `Memory: ${memory}`,
    ];

    const maxLogoWidth = Math.max(...logo.map((l) => l.length));
    const lines = Math.max(logo.length, info.length);

    for (let i = 0; i < lines; i++) {
      const logoLine = logo[i] ?? '';
      const infoLine = info[i] ?? '';
      yield logoLine.padEnd(maxLogoWidth + 2) + infoLine + '\n';
    }
  },
};
