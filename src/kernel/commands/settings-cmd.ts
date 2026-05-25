import type { Command } from '@/kernel/types';

export const settingsCommand: Command = {
  name: 'settings',
  help: 'Export or import settings as JSON',
  usage: 'settings export | settings import',
  async *run(ctx) {
    const args = ctx.args;
    const sub = args[0];
    if (!sub || (sub !== 'export' && sub !== 'import')) {
      yield `Usage: ${'settings export | settings import'}\n`;
      return;
    }
    if (sub === 'export') {
      yield JSON.stringify(ctx.state, null, 2) + '\n';
    } else {
      try {
        const json = args.slice(1).join(' ');
        const data = JSON.parse(json);
        if (data.skin) ctx.state.skin = data.skin;
        if (data.mode) ctx.state.mode = data.mode;
        if (data.fxEnabled !== undefined) ctx.state.fxEnabled = data.fxEnabled;
        yield 'Settings imported.\n';
      } catch {
        yield 'settings import: invalid JSON\n';
      }
    }
  },
};

export const shareThemeCommand: Command = {
  name: 'share-theme',
  help: 'Generate a shareable theme code or apply one',
  usage: 'share-theme [code]',
  async *run(ctx) {
    const code = ctx.args[0];
    if (!code) {
      const s = ctx.state;
      const payload = { skin: s.skin, mode: s.mode, fxEnabled: s.fxEnabled };
      const encoded = btoa(JSON.stringify(payload));
      yield `Share this code:\n${encoded}\n`;
      yield `Use: share-theme ${encoded}\n`;
      return;
    }
    try {
      const decoded = JSON.parse(atob(code));
      if (decoded.skin) ctx.state.skin = decoded.skin;
      if (decoded.mode) ctx.state.mode = decoded.mode;
      if (decoded.fxEnabled !== undefined) ctx.state.fxEnabled = decoded.fxEnabled;
      yield 'Theme applied from code.\n';
    } catch {
      yield 'share-theme: invalid code\n';
    }
  },
};
