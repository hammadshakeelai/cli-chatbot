import type { Repl, TermIO } from '@/term/types';
import { Spinner } from '@/term/spinner';
import { StreamPrinter } from '@/term/streamPrinter';
import { sgr, RESET, fgHex } from '@/term/ansi';
import { useUI } from '@/store/ui';
import type { ChatMsg } from '@/providers/types';
import type { AgentDef } from './types';
import { buildTheater, buildPlan } from './theater';

const MAX_CONTEXT = 20;

export function createAgentRepl(def: AgentDef, cwd: string): Repl {
  const accent = fgHex(def.accent);
  const messages: ChatMsg[] = [];
  let lastCtrlC = 0;
  let exchanges = 0;

  const repl: Repl = {
    id: def.id,
    history: [],

    prompt() {
      return accent + def.promptGlyph + RESET + ' ';
    },

    ghost() {
      return exchanges === 0 ? def.ghost : undefined;
    },

    onAttach(io, firstTime) {
      io.setTitle(`${def.icon} ${def.label}`);
      if (!firstTime) return;
      io.writeln('');
      for (const line of def.banner({ cwd, cols: io.cols() })) io.writeln(line);
      io.writeln('');
    },

    onIdleInterrupt(io) {
      const now = Date.now();
      if (now - lastCtrlC < 2000) {
        io.writeln(sgr.dim + def.farewell + RESET);
        return 'exit';
      }
      lastCtrlC = now;
      io.writeln(sgr.dim + 'Press Ctrl+C again to exit (or type /exit)' + RESET);
      return undefined;
    },

    complete(line, cursor) {
      const word = line.slice(0, cursor);
      if (!word.startsWith('/')) return undefined;
      const cmds = ['/help', '/clear', '/model', '/status', '/exit'];
      const items = cmds.filter((c) => c.startsWith(word.toLowerCase()));
      return items.length ? { items, replaceStart: 0 } : undefined;
    },

    async run(line, io, host) {
      const text = line.trim();
      if (!text) return;

      // ── slash commands ──
      const lower = text.toLowerCase();
      if (lower === '/exit' || lower === 'exit' || lower === '/quit' || lower === ':q') {
        io.writeln(sgr.dim + def.farewell + RESET);
        host.popRepl();
        return;
      }
      if (lower === '/clear') {
        io.clear();
        messages.length = 0;
        io.writeln(sgr.dim + 'Context cleared. Starting fresh.' + RESET);
        io.writeln('');
        return;
      }
      if (lower === '/help' || lower === 'help') {
        printHelp(io, def);
        return;
      }
      if (lower === '/model') {
        io.writeln('');
        io.writeln(`  ${sgr.bold}model${RESET}     ${def.displayModel}`);
        io.writeln(`  ${sgr.dim}backend   ${describeBackend(def)} (simulated session — replies are real)${RESET}`);
        io.writeln('');
        return;
      }
      if (lower === '/status') {
        printStatus(io, def, messages.length);
        return;
      }
      if (text.startsWith('/')) {
        io.writeln(sgr.dim + `Unknown command ${text.split(' ')[0]} — try /help` + RESET);
        return;
      }

      await chat(text, io);
    },
  };

  async function chat(text: string, io: TermIO): Promise<void> {
    exchanges++;
    messages.push({ role: 'user', content: text });
    io.writeln('');

    const verb = def.spinnerVerbs[Math.floor(Math.random() * def.spinnerVerbs.length)]!;
    const spinner = new Spinner(io, {
      frames: def.spinnerFrames,
      frameColor: accent,
      text: (ms) => sgr.dim + `${verb}… (${Math.floor(ms / 1000)}s · esc to interrupt)` + RESET,
    });
    spinner.start();

    const aborted = () => io.signal().aborted;
    const startedAt = Date.now();

    try {
      // ── thinking pause ──
      await io.sleep(500 + Math.random() * 600);
      if (aborted()) { interrupted(io, spinner); return; }

      // ── simulated agentic activity ──
      if (def.planning) {
        const plan = buildPlan(text);
        if (plan.length) {
          spinner.pause();
          io.writeln(accent + '◆' + RESET + ' ' + sgr.bold + 'Plan' + RESET);
          for (const item of plan) {
            if (aborted()) { interrupted(io, spinner); return; }
            io.write(sgr.dim + '  ☐ ' + item + RESET);
            await io.sleep(280 + Math.random() * 380);
            io.write('\r\x1b[K  ' + accent + '✓' + RESET + ' ' + sgr.dim + item + RESET + '\n');
          }
          io.writeln('');
          spinner.resume();
        }
      } else {
        const steps = buildTheater(text, def);
        for (const step of steps) {
          if (aborted()) { interrupted(io, spinner); return; }
          await io.sleep(step.delayMs);
          if (aborted()) { interrupted(io, spinner); return; }
          spinner.pause();
          io.writeln(accent + def.toolGlyph + RESET + ' ' + sgr.bold + step.toolName + RESET + `(${step.arg})`);
          await io.sleep(150 + Math.random() * 250);
          io.writeln(sgr.dim + `  ⎿  ${step.result}` + RESET);
          spinner.resume();
        }
      }

      // ── real LLM call ──
      const settings = useUI.getState().settings;
      const model = settings.model !== 'auto' ? settings.model : def.realModel;
      const body = {
        messages: messages.slice(-MAX_CONTEXT),
        model,
        persona: def.persona,
        key: settings.byokKey || undefined,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: io.signal(),
      });

      if (!res.ok) {
        spinner.stop();
        let msg = `HTTP ${res.status}`;
        try { msg = ((await res.json()) as { message?: string }).message ?? msg; } catch { /* ignore */ }
        io.writeln(sgr.brightRed + '✗ ' + msg + RESET);
        io.writeln('');
        messages.pop();
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        spinner.stop();
        io.writeln(sgr.brightRed + '✗ no response stream' + RESET);
        messages.pop();
        return;
      }

      const printer = new StreamPrinter((s) => io.write(s), {
        width: () => Math.min(io.cols() - 2, 100),
        firstPrefix: accent + def.replyGlyph + RESET + ' ',
        firstPrefixWidth: def.replyGlyph.length + 1,
        indent: '  ',
        codeColor: sgr.brightGreen,
        headingColor: accent,
      });

      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      let first = true;
      let errored = false;

      while (true) {
        if (aborted()) {
          reader.cancel().catch(() => {});
          if (first) { interrupted(io, spinner); messages.pop(); return; }
          printer.end();
          io.writeln(sgr.dim + '  ⎿  Interrupted' + RESET);
          io.writeln('');
          messages.push({ role: 'assistant', content: full });
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const raw of lines) {
          if (!raw.startsWith('data: ')) continue;
          const data = raw.slice(6);
          if (!data) continue;
          try {
            const delta = JSON.parse(data) as { type: string; text?: string; message?: string; code?: string };
            if (delta.type === 'delta' && delta.text) {
              if (first) { spinner.stop(); first = false; }
              full += delta.text;
              printer.push(delta.text);
            } else if (delta.type === 'error') {
              spinner.stop();
              if (!first) printer.end();
              io.writeln(sgr.brightRed + '✗ ' + (delta.message ?? 'provider error') + RESET);
              if (delta.code === 'ALL_EXHAUSTED') printKeyHelp(io);
              errored = true;
            }
          } catch { /* skip malformed */ }
        }
        if (errored) break;
      }

      if (first && !errored) {
        spinner.stop();
        io.writeln(sgr.dim + '(no response — provider may be rate-limited, try again)' + RESET);
        messages.pop();
        io.writeln('');
        return;
      }
      if (!errored) {
        printer.end();
        messages.push({ role: 'assistant', content: full });
        const footer = def.footer?.(Date.now() - startedAt, full.length);
        if (footer) io.writeln(sgr.dim + footer + RESET);
      } else {
        messages.pop();
      }
      io.writeln('');
    } catch (err) {
      spinner.stop();
      if ((err as Error).name === 'AbortError' || aborted()) {
        interrupted(io, spinner);
        if (messages[messages.length - 1]?.role === 'user') messages.pop();
        return;
      }
      io.writeln(sgr.brightRed + '✗ request failed — check your connection' + RESET);
      io.writeln('');
      if (messages[messages.length - 1]?.role === 'user') messages.pop();
    }
  }

  function interrupted(io: TermIO, spinner: Spinner): void {
    spinner.stop();
    io.writeln(sgr.dim + '⎿  Interrupted — tell me what to do differently.' + RESET);
    io.writeln('');
  }

  function printKeyHelp(io: TermIO): void {
    const hasByok = !!useUI.getState().settings.byokKey;
    io.writeln(sgr.dim + (hasByok
      ? '  ⎿  Your key was rejected by every provider — double-check it in Settings (⚙).'
      : '  ⎿  No working AI key is configured. Grab a free key and either:') + RESET);
    if (!hasByok) {
      io.writeln(sgr.dim + '      · paste it in Settings (⚙) → "Bring your own API key", or' + RESET);
      io.writeln(sgr.dim + '      · add it to .env.local (GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY)' + RESET);
      io.writeln(sgr.dim + '      free keys: aistudio.google.com/apikey · console.groq.com/keys · openrouter.ai/keys' + RESET);
    }
  }

  function printHelp(io: TermIO, d: AgentDef): void {
    io.writeln('');
    io.writeln(`  ${sgr.bold}${d.label}${RESET} ${sgr.dim}· ${d.displayModel}${RESET}`);
    io.writeln('');
    io.writeln(`  Just type to chat. The agent streams replies into the terminal.`);
    io.writeln('');
    io.writeln(`  ${sgr.bold}/help${RESET}     show this help`);
    io.writeln(`  ${sgr.bold}/clear${RESET}    clear screen + conversation context`);
    io.writeln(`  ${sgr.bold}/model${RESET}    show the active model`);
    io.writeln(`  ${sgr.bold}/status${RESET}   session status`);
    io.writeln(`  ${sgr.bold}/exit${RESET}     return to PowerShell`);
    io.writeln('');
    io.writeln(`  ${sgr.dim}esc interrupts a streaming reply · Ctrl+C twice exits${RESET}`);
    io.writeln('');
  }

  function printStatus(io: TermIO, d: AgentDef, msgCount: number): void {
    const settings = useUI.getState().settings;
    io.writeln('');
    io.writeln(`  ${sgr.bold}${d.label}${RESET}`);
    io.writeln(`  ${sgr.dim}─────────────────────────────${RESET}`);
    io.writeln(`  session    ${msgCount / 2 | 0} exchange${msgCount === 2 ? '' : 's'} in context`);
    io.writeln(`  model      ${d.displayModel}`);
    io.writeln(`  backend    ${settings.model !== 'auto' ? settings.model : describeBackend(d)}`);
    io.writeln(`  key        ${settings.byokKey ? 'bring-your-own key' : 'server-side (shared, rate-limited)'}`);
    io.writeln(`  cwd        ${cwd}`);
    io.writeln('');
  }

  return repl;
}

function describeBackend(def: AgentDef): string {
  return def.realModel;
}
