# 04 — Terminal Engine

The pure-TS heart. No React. Fully unit-testable.

## Virtual filesystem (VFS)
- Tree of nodes: `{ type: 'dir'|'file', name, children?, content?, mode, mtime }`.
- Root `/`; seeded `/home/user` (home), `/bin`, `/etc`, `/var/lib/mirage`, `/tmp`, plus fun seed files (`~/welcome.txt`, `~/Documents/asciiart/` echoing the reference cwd).
- API: `resolve(path, cwd)`, `read`, `write`, `mkdir`, `unlink`, `move`, `list`, `stat`. Path logic handles `.`, `..`, `~`, absolute/relative.
- **Persistence:** serialize to IndexedDB on idle (debounced); hydrate on boot. Versioned schema with a migration hook.
- Shared across tabs (one FS). Guard against pathological depth/size (cap total bytes; refuse to write huge files).

## Parser & pipeline
- **Tokenize** with `shell-quote` (handles quotes/escapes). Then build a small AST:
  - sequence: `cmd ; cmd`, `cmd && cmd`
  - pipeline: `cmd | cmd | cmd`
  - redirects: `> file`, `>> file`, (`< file` later)
  - expansion: `$VAR`, `${VAR}`, glob `*`/`?` against VFS, `~` → home.
- **Execute:** each pipeline stage gets `stdin` (async iterable) from the previous stage's `stdout`; final stage writes to terminal or redirect target. `&&` checks exit code; `;` always continues.
- **Interrupt:** every `run` receives an `AbortSignal`; Ctrl+C/Esc aborts the current pipeline. Long apps must poll the signal.
- **Incremental plan:** Sprint-2 = simple commands + `|` + `&&` + `$VAR`. Globbing/redirects = Sprint-3. Subshells/`<`/job control = backlog. *Do not* attempt full POSIX.

## Command context
```ts
interface CommandContext {
  args: string[]; flags: Record<string,string|boolean>;
  cwd: string; env: Env; vfs: VFS;
  stdin?: AsyncIterable<string>;
  signal: AbortSignal;
  ui: { skin: string; mode: 'dark'|'light'; cols: number; rows: number };
  emit(chunk: string): void;            // convenience for sync output
}
```

## Core commands (Sprint 2–3)
`ls -la` (color by type), `cd`, `pwd`, `cat`, `echo`, `mkdir -p`, `touch`, `rm -r`, `mv`, `cp`, `clear`, `whoami`, `uname -a`, `history`, `help`, `man`, `grep`, `head`, `tail`, `wc`, `env`, `export`, `date`, `cal`, `which`, `tree`, `df`, `uptime`, `ps`, `neofetch`. Each: a `Command` module, registered, with `--help`.

## Fake package manager (`apt`)
- **Package registry** `apt/packages.ts`: `{ name, version, size, deps?, provides: appId }`.
- `apt update` → animated "Hit/Get" lines. `apt search <q>` → filter. `apt list --installed`.
- `apt install <pkg>` → resolve deps → animate per-package download (progress bar with bytes/sec) → unpack → mark installed in `/var/lib/mirage/installed.json` → unlock the app command. Honors Esc to abort mid-install (rolls back).
- `apt remove <pkg>` → re-locks the command.
- Apps appear as "command not found — try `apt install <pkg>`" until installed (the illusion).

## Bundled apps (gated behind apt)
| app | pkg | implementation note |
|---|---|---|
| `figlet` | figlet | `figlet` npm lib; pick font; ANSI output |
| `toilet` | toilet | figlet + color/border flair |
| `cowsay` | cowsay | speech-bubble template; cow/dragon/tux variants |
| `lolcat` | lolcat | wraps stdin, applies rainbow ANSI gradient (works in a pipe) |
| `cmatrix` | cmatrix | rAF green rain; FPS-capped; Esc/Ctrl-C to stop; pause when tab hidden |
| `hollywood` | hollywood | random split-pane fake "hacking" chaos; reduced-motion → static |
| `sl` | sl | ASCII steam locomotive scrolls across (nod to `vagonparovoz`) |
| `nyancat` | nyancat | looping rainbow cat animation |
| `neofetch` | (preinstalled) | Mirage logo + fake system stats (skin-aware) |
| `fortune` | fortune | random quotes; pairs with `cowsay` via pipe |

**Animation rules (all apps):** drive with `requestAnimationFrame`, cap to ~30–60fps, batch xterm writes, poll `signal` each frame, fully stop & clean up on abort, and render a static frame (or skip) when `prefers-reduced-motion` is set or the tab is hidden.

## Tab completion
- On Tab: if cursor is in command position → complete against command+installed-app names; else → complete against VFS paths in cwd. Cycle on repeated Tab; show candidates on double-Tab.

## History
- Per-session ring buffer (cap 500), persisted. Up/Down to navigate, `Ctrl+R` reverse-search (backlog), `history` prints with indices, `!n` re-runs (backlog).

## AI bridge command
- `ai` / `ask`: collects the prompt (args or current chat buffer), opens an SSE stream to `/api/chat`, writes deltas to the terminal with a typewriter cadence and a spinner/status, abortable via signal. Also the **fallthrough handler**: when a line isn't a known command/slash command, the kernel offers/sends it to `ask` (configurable: auto vs prompt-to-confirm).
