import { THEATER_FILES } from '@/shell/winfs';
import type { AgentDef, TheaterTool } from './types';

/**
 * "Agentic theater" — plausible simulated tool activity shown before the real
 * LLM reply. Deterministic per query (seeded hash) so it feels intentional,
 * referencing real paths from the fake filesystem.
 */

export interface TheaterStep {
  tool: TheaterTool;
  toolName: string;
  arg: string;
  result: string;
  delayMs: number;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

const CHATTY = /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|cool|nice|lol|good morning|good night|how are you)\b/i;

const DEFAULT_TOOL_NAMES: Record<TheaterTool, string> = {
  read: 'Read',
  grep: 'Search',
  bash: 'Bash',
  edit: 'Edit',
  web: 'WebSearch',
  browse: 'Fetch',
};

export function buildTheater(query: string, def: AgentDef): TheaterStep[] {
  const q = query.toLowerCase();
  if (CHATTY.test(q.trim()) || q.trim().length < 10) return [];

  const seed = hash(query);
  const rand = rng(seed);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const names = { ...DEFAULT_TOOL_NAMES, ...(def.toolNames ?? {}) };
  const steps: TheaterStep[] = [];

  const wantsCode = /\b(code|file|project|src|function|bug|fix|error|refactor|review|implement|class|typescript|javascript|python|react|component|api|readme|package|test|build|module|script)\b/.test(q);
  const wantsRun = /\b(run|test|build|install|compile|npm|node|deploy|start|lint)\b/.test(q);
  const wantsWeb = /\b(web|search|latest|news|current|today|version of|release|what is|who is|when did|docs|documentation|how much|price)\b/.test(q);
  const wantsEdit = /\b(write|create|add|edit|change|update|rename|make a|generate)\b/.test(q) && wantsCode;

  const file = () => pick(THEATER_FILES);

  if (wantsCode) {
    const f = file();
    steps.push({
      tool: 'read', toolName: names.read, arg: shortPath(f),
      result: `Read ${18 + Math.floor(rand() * 60)} lines`,
      delayMs: 350 + rand() * 450,
    });
    if (rand() > 0.45) {
      const terms = q.match(/\b[a-z]{4,12}\b/g) ?? ['main'];
      steps.push({
        tool: 'grep', toolName: names.grep, arg: `"${pick(terms)}"`,
        result: `Found ${1 + Math.floor(rand() * 6)} matches`,
        delayMs: 280 + rand() * 380,
      });
    }
  }

  if (wantsRun) {
    const cmd = /test/.test(q) ? 'npm test' : /build|compile/.test(q) ? 'npm run build' : /lint/.test(q) ? 'npm run lint' : 'npm run dev';
    const ok = rand() > 0.2;
    steps.push({
      tool: 'bash', toolName: names.bash, arg: cmd,
      result: cmd === 'npm test'
        ? (ok ? `${8 + Math.floor(rand() * 14)} passed (${(0.8 + rand() * 2).toFixed(1)}s)` : `1 failed, ${8 + Math.floor(rand() * 10)} passed`)
        : (ok ? `Done in ${(0.6 + rand() * 3).toFixed(1)}s` : 'exit code 1'),
      delayMs: 500 + rand() * 700,
    });
  }

  if (wantsEdit && steps.length < 3) {
    steps.push({
      tool: 'edit', toolName: names.edit, arg: shortPath(file()),
      result: `Updated ${1 + Math.floor(rand() * 3)} section${rand() > 0.5 ? 's' : ''}`,
      delayMs: 380 + rand() * 420,
    });
  }

  if (wantsWeb && steps.length < 3) {
    const trimmed = query.replace(/[?.!]+$/, '').slice(0, 42);
    steps.push({
      tool: 'web', toolName: names.web, arg: `"${trimmed}${query.length > 42 ? '…' : ''}"`,
      result: `${2 + Math.floor(rand() * 6)} results`,
      delayMs: 450 + rand() * 600,
    });
  }

  // Occasionally show light activity even for plain questions
  if (steps.length === 0 && rand() > 0.72 && q.length > 24) {
    steps.push({
      tool: 'read', toolName: names.read, arg: shortPath(file()),
      result: `Read ${10 + Math.floor(rand() * 30)} lines`,
      delayMs: 320 + rand() * 300,
    });
  }

  return steps.slice(0, 3);
}

/** Plan checklist for "manager-style" agents (Antigravity). */
export function buildPlan(query: string): string[] {
  const q = query.toLowerCase();
  const seed = hash(query);
  const rand = rng(seed);
  if (CHATTY.test(q.trim()) || q.trim().length < 10) return [];

  const plan: string[] = ['Parse request and constraints'];
  if (/\b(code|file|project|src|bug|fix|refactor|implement|component|api|test|build)\b/.test(q)) {
    plan.push('Scan workspace for relevant files');
    plan.push(rand() > 0.5 ? 'Trace the affected code path' : 'Review demo-app sources');
  }
  if (/\b(web|search|latest|news|version|docs|release)\b/.test(q)) {
    plan.push('Gather up-to-date references');
  }
  plan.push(rand() > 0.5 ? 'Draft and verify the answer' : 'Compose response');
  return plan.slice(0, 4);
}

function shortPath(p: string): string {
  return p.replace(/^C:\\Users\\[^\\]+\\/, '~\\');
}
