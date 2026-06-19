import { HOME_DIR, USER_NAME } from '@/lib/constants';

/**
 * In-memory Windows-flavored filesystem.
 * - Single C: drive, case-insensitive lookups, case-preserving names.
 * - Accepts both `\` and `/` separators; resolves `.`, `..`, `~`.
 */

export interface WinNode {
  kind: 'dir' | 'file';
  name: string;                       // display casing
  children?: Map<string, WinNode>;    // key = lowercase name
  content?: string;
  mtime: Date;
}

export class WinFS {
  private root: WinNode; // represents C:\

  constructor() {
    this.root = { kind: 'dir', name: 'C:', children: new Map(), mtime: new Date() };
    seed(this);
  }

  /** Normalize any user path into canonical `C:\...` form (logical; may not exist). */
  resolve(path: string, cwd: string): string {
    let p = (path ?? '').trim().replace(/\//g, '\\');
    if (p === '' || p === '.') p = cwd;
    if (p === '~') p = HOME_DIR;
    else if (p.startsWith('~\\')) p = HOME_DIR + p.slice(1);

    let parts: string[];
    if (/^[A-Za-z]:/.test(p)) {
      parts = p.slice(2).split('\\').filter(Boolean);
    } else if (p.startsWith('\\')) {
      parts = p.split('\\').filter(Boolean);
    } else {
      parts = [...cwd.slice(3).split('\\').filter(Boolean), ...p.split('\\').filter(Boolean)];
    }

    const out: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { out.pop(); continue; }
      out.push(part);
    }
    return 'C:\\' + out.join('\\');
  }

  /** Get node + canonical display path. */
  lookup(abs: string): { node: WinNode; display: string } | undefined {
    const segs = abs.slice(3).split('\\').filter(Boolean);
    let node = this.root;
    const display: string[] = [];
    for (const seg of segs) {
      const child = node.children?.get(seg.toLowerCase());
      if (!child) return undefined;
      node = child;
      display.push(child.name);
    }
    return { node, display: 'C:\\' + display.join('\\') };
  }

  stat(path: string, cwd: string): WinNode | undefined {
    return this.lookup(this.resolve(path, cwd))?.node;
  }

  /** Canonical (case-corrected) path if it exists. */
  canonical(path: string, cwd: string): string | undefined {
    return this.lookup(this.resolve(path, cwd))?.display;
  }

  exists(path: string, cwd: string): boolean {
    return this.stat(path, cwd) !== undefined;
  }

  list(path: string, cwd: string): WinNode[] | undefined {
    const node = this.stat(path, cwd);
    if (!node || node.kind !== 'dir') return undefined;
    return [...(node.children?.values() ?? [])].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }

  read(path: string, cwd: string): string | undefined {
    const node = this.stat(path, cwd);
    return node?.kind === 'file' ? (node.content ?? '') : undefined;
  }

  write(path: string, content: string, cwd: string, append = false): string | undefined {
    const abs = this.resolve(path, cwd);
    const parentAbs = parentOf(abs);
    const name = baseName(abs);
    if (!name) return 'Cannot write to a drive root.';
    const parent = this.lookup(parentAbs)?.node;
    if (!parent || parent.kind !== 'dir') return `Could not find a part of the path '${abs}'.`;
    const key = name.toLowerCase();
    const existing = parent.children!.get(key);
    if (existing?.kind === 'dir') return `Access to the path '${abs}' is denied.`;
    const next: WinNode = {
      kind: 'file',
      name: existing?.name ?? name,
      content: append && existing ? (existing.content ?? '') + content : content,
      mtime: new Date(),
    };
    parent.children!.set(key, next);
    return undefined;
  }

  mkdir(path: string, cwd: string): string | undefined {
    const abs = this.resolve(path, cwd);
    const segs = abs.slice(3).split('\\').filter(Boolean);
    if (segs.length === 0) return 'Cannot create the drive root.';
    let node = this.root;
    for (const seg of segs) {
      const key = seg.toLowerCase();
      let child = node.children!.get(key);
      if (!child) {
        child = { kind: 'dir', name: seg, children: new Map(), mtime: new Date() };
        node.children!.set(key, child);
      } else if (child.kind === 'file') {
        return `An item with the specified name ${abs} already exists.`;
      }
      node = child;
    }
    return undefined;
  }

  remove(path: string, cwd: string, recursive: boolean): string | undefined {
    const abs = this.resolve(path, cwd);
    const found = this.lookup(abs);
    if (!found) return `Cannot find path '${abs}' because it does not exist.`;
    if (found.node.kind === 'dir' && (found.node.children?.size ?? 0) > 0 && !recursive) {
      return `The item at ${abs} has children and the -Recurse parameter was not specified.`;
    }
    const parent = this.lookup(parentOf(abs))?.node;
    parent?.children?.delete(baseName(abs).toLowerCase());
    return undefined;
  }

  copy(src: string, dest: string, cwd: string): string | undefined {
    const found = this.lookup(this.resolve(src, cwd));
    if (!found) return `Cannot find path '${this.resolve(src, cwd)}' because it does not exist.`;
    const destAbs = this.resolve(dest, cwd);
    const destNode = this.lookup(destAbs)?.node;
    // Copy *into* an existing directory keeps the original name.
    const targetAbs = destNode?.kind === 'dir' ? destAbs + '\\' + found.node.name : destAbs;
    const parent = this.lookup(parentOf(targetAbs))?.node;
    const name = baseName(targetAbs);
    if (!parent || parent.kind !== 'dir' || !name) {
      return `Could not find a part of the path '${targetAbs}'.`;
    }
    parent.children!.set(name.toLowerCase(), cloneNode(found.node, name));
    return undefined;
  }

  move(src: string, dest: string, cwd: string): string | undefined {
    const srcAbs = this.resolve(src, cwd);
    const err = this.copy(src, dest, cwd);
    if (err) return err;
    return this.remove(srcAbs, cwd, true);
  }
}

export function parentOf(abs: string): string {
  const segs = abs.slice(3).split('\\').filter(Boolean);
  segs.pop();
  return 'C:\\' + segs.join('\\');
}

export function baseName(abs: string): string {
  const segs = abs.split('\\').filter((s) => s && !/^[A-Za-z]:$/.test(s));
  return segs[segs.length - 1] ?? '';
}

function cloneNode(node: WinNode, name: string): WinNode {
  if (node.kind === 'file') {
    return { kind: 'file', name, content: node.content, mtime: new Date() };
  }
  const children = new Map<string, WinNode>();
  for (const [k, v] of node.children ?? []) children.set(k, cloneNode(v, v.name));
  return { kind: 'dir', name, children, mtime: new Date() };
}

/* ── Seed content ─────────────────────────────────────────────────────────── */

function seed(fs: WinFS): void {
  const dirs = [
    'C:\\Windows\\System32',
    'C:\\Program Files\\Common Files',
    'C:\\Program Files (x86)',
    'C:\\Temp',
    `${HOME_DIR}\\Desktop`,
    `${HOME_DIR}\\Documents`,
    `${HOME_DIR}\\Downloads`,
    `${HOME_DIR}\\Pictures`,
    `${HOME_DIR}\\Music`,
    `${HOME_DIR}\\Videos`,
    `${HOME_DIR}\\projects\\demo-app\\src`,
  ];
  for (const d of dirs) fs.mkdir(d, 'C:\\');

  const files: Record<string, string> = {
    [`${HOME_DIR}\\notes.txt`]:
      `Things to remember\n` +
      `- this terminal is a simulation (a pretty convincing one)\n` +
      `- type 'agents' to list the AI CLIs\n` +
      `- type 'claude' to launch Claude Code\n`,
    [`${HOME_DIR}\\todo.md`]:
      `# TODO\n\n- [x] install a terminal that isn't there\n- [ ] ship demo-app\n- [ ] touch grass\n`,
    [`${HOME_DIR}\\Documents\\readme.txt`]:
      `Welcome to Mirage Terminal.\n\nEverything here runs in your browser. No real files were harmed.\n`,
    [`${HOME_DIR}\\projects\\demo-app\\package.json`]:
      `{\n  "name": "demo-app",\n  "version": "1.0.3",\n  "private": true,\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "test": "vitest run"\n  },\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  },\n  "devDependencies": {\n    "typescript": "^5.7.0",\n    "vite": "^6.0.0",\n    "vitest": "^3.0.0"\n  }\n}\n`,
    [`${HOME_DIR}\\projects\\demo-app\\README.md`]:
      `# demo-app\n\nA tiny React demo used to make the AI agents in this terminal look busy.\n\n## Scripts\n\n- npm run dev — start dev server\n- npm run build — production build\n- npm run test — run tests\n`,
    [`${HOME_DIR}\\projects\\demo-app\\src\\index.ts`]:
      `import { formatGreeting } from './utils';\n\nconst el = document.querySelector('#app');\nif (el) {\n  el.textContent = formatGreeting('${USER_NAME}');\n}\n\nexport {};\n`,
    [`${HOME_DIR}\\projects\\demo-app\\src\\utils.ts`]:
      `export function formatGreeting(name: string): string {\n  const hour = new Date().getHours();\n  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';\n  return \`Good \${part}, \${name}!\`;\n}\n\nexport function clamp(n: number, min: number, max: number): number {\n  return Math.min(max, Math.max(min, n));\n}\n`,
    [`${HOME_DIR}\\Desktop\\desktop.ini`]: `[.ShellClassInfo]\nLocalizedResourceName=Desktop\n`,
  };
  for (const [path, content] of Object.entries(files)) fs.write(path, content, 'C:\\');
}

/** Project files agents reference in simulated tool calls. */
export const THEATER_FILES = [
  `${HOME_DIR}\\projects\\demo-app\\package.json`,
  `${HOME_DIR}\\projects\\demo-app\\README.md`,
  `${HOME_DIR}\\projects\\demo-app\\src\\index.ts`,
  `${HOME_DIR}\\projects\\demo-app\\src\\utils.ts`,
  `${HOME_DIR}\\notes.txt`,
  `${HOME_DIR}\\todo.md`,
];
