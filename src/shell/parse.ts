/** Minimal PowerShell-flavored line parser: quotes, `|`, `>`, `>>`, `;`, `&&`. */

export interface Redirect { file: string; append: boolean; }

export interface ParsedCmd {
  name: string;
  args: string[];
  redirect?: Redirect;
}

export interface Statement {
  /** How this statement chains after the previous one. */
  op: ';' | '&&';
  pipeline: ParsedCmd[];
}

type Token = { kind: 'word'; text: string } | { kind: 'op'; text: '|' | ';' | '&&' | '>' | '>>' };

export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i]!;
    if (ch === ' ' || ch === '\t') { i++; continue; }

    if (ch === '|') { tokens.push({ kind: 'op', text: '|' }); i++; continue; }
    if (ch === ';') { tokens.push({ kind: 'op', text: ';' }); i++; continue; }
    if (ch === '&' && line[i + 1] === '&') { tokens.push({ kind: 'op', text: '&&' }); i += 2; continue; }
    if (ch === '>') {
      if (line[i + 1] === '>') { tokens.push({ kind: 'op', text: '>>' }); i += 2; }
      else { tokens.push({ kind: 'op', text: '>' }); i++; }
      continue;
    }

    // Word (may contain quoted spans)
    let word = '';
    while (i < n) {
      const c = line[i]!;
      if (c === ' ' || c === '\t' || c === '|' || c === ';' || c === '>' ||
          (c === '&' && line[i + 1] === '&')) break;
      if (c === "'") {
        const end = line.indexOf("'", i + 1);
        if (end === -1) { word += line.slice(i + 1); i = n; }
        else { word += line.slice(i + 1, end); i = end + 1; }
      } else if (c === '"') {
        i++;
        while (i < n && line[i] !== '"') {
          if (line[i] === '`' && i + 1 < n) { word += line[i + 1]; i += 2; }
          else { word += line[i]; i++; }
        }
        i++; // closing quote
      } else if (c === '`' && i + 1 < n) {
        word += line[i + 1]; i += 2;
      } else {
        word += c; i++;
      }
    }
    tokens.push({ kind: 'word', text: word });
  }
  return tokens;
}

export function parseLine(line: string): Statement[] {
  const tokens = tokenize(line);
  const statements: Statement[] = [];
  let op: ';' | '&&' = ';';
  let pipeline: ParsedCmd[] = [];
  let current: ParsedCmd | null = null;
  let redirectNext: false | '>' | '>>' = false;

  const flushCmd = () => {
    if (current) pipeline.push(current);
    current = null;
  };
  const flushStatement = (nextOp: ';' | '&&') => {
    flushCmd();
    if (pipeline.length > 0) statements.push({ op, pipeline });
    pipeline = [];
    op = nextOp;
  };

  for (const tok of tokens) {
    if (tok.kind === 'op') {
      if (tok.text === '|') flushCmd();
      else if (tok.text === ';') flushStatement(';');
      else if (tok.text === '&&') flushStatement('&&');
      else redirectNext = tok.text; // > or >>
      continue;
    }
    if (redirectNext) {
      if (!current) current = { name: '', args: [] };
      current.redirect = { file: tok.text, append: redirectNext === '>>' };
      redirectNext = false;
      continue;
    }
    if (!current) current = { name: tok.text, args: [] };
    else current.args.push(tok.text);
  }
  flushStatement(';');
  return statements.filter((s) => s.pipeline.some((c) => c.name !== ''));
}
