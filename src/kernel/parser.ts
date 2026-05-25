export type RedirectOp = '>' | '>>';

export interface PipelineCmd {
  command: string;
  args: string[];
  redirect?: { op: RedirectOp; file: string };
}

export type SequenceOp = '&&' | ';';

export interface SequenceStep {
  commands: PipelineCmd[];
  op: SequenceOp;
}

export function parse(input: string): SequenceStep[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const tokens = tokenize(trimmed);
  const sequences: SequenceStep[] = [];
  let currentTokens: string[] = [];
  let previousOp: SequenceOp = ';';

  for (const tok of tokens) {
    if (tok === '&&' || tok === ';') {
      if (currentTokens.length > 0) {
        const cmds = buildPipelines(currentTokens);
        if (cmds.length > 0) {
          sequences.push({ commands: cmds, op: previousOp });
        }
        currentTokens = [];
      }
      previousOp = tok === '&&' ? '&&' : ';';
      continue;
    }
    currentTokens.push(tok);
  }

  if (currentTokens.length > 0) {
    const cmds = buildPipelines(currentTokens);
    if (cmds.length > 0) {
      sequences.push({ commands: cmds, op: previousOp });
    }
  }

  return sequences;
}

function buildPipelines(tokens: string[]): PipelineCmd[] {
  const cmds: PipelineCmd[] = [];
  const currentArgs: string[] = [];
  let redirect: PipelineCmd['redirect'] | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;

    if (tok === '|') {
      flushCmd(currentArgs, cmds, redirect);
      redirect = null;
      continue;
    }

    if (tok === '>' || tok === '>>') {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        redirect = { op: tok, file: next };
        i++;
      }
      continue;
    }

    currentArgs.push(tok);
  }

  flushCmd(currentArgs, cmds, redirect);
  return cmds;
}

function flushCmd(
  args: string[],
  cmds: PipelineCmd[],
  redirect: PipelineCmd['redirect'] | null,
): void {
  if (args.length === 0) return;
  cmds.push({
    command: args[0]!,
    args: args.slice(1),
    redirect: redirect ?? undefined,
  });
  args.length = 0;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (inSingle) {
      if (ch === "'") inSingle = false;
      else current += ch;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      else current += ch;
      continue;
    }
    if (ch === "'") { inSingle = true; continue; }
    if (ch === '"') { inDouble = true; continue; }

    if (ch === '|') { flushToken(current, tokens); current = ''; tokens.push('|'); continue; }
    if (ch === ';') { flushToken(current, tokens); current = ''; tokens.push(';'); continue; }
    if (ch === '&') {
      flushToken(current, tokens); current = '';
      if (i + 1 < input.length && input[i + 1] === '&') {
        tokens.push('&&'); i++;
      } else { tokens.push('&'); }
      continue;
    }
    if (ch === '>') {
      flushToken(current, tokens); current = '';
      if (i + 1 < input.length && input[i + 1] === '>') {
        tokens.push('>>'); i++;
      } else { tokens.push('>'); }
      continue;
    }
    if (ch === ' ' || ch === '\t') { flushToken(current, tokens); current = ''; continue; }

    current += ch;
  }

  flushToken(current, tokens);
  return tokens;
}

function flushToken(current: string, tokens: string[]): void {
  if (current.trim()) tokens.push(current.trim());
}
