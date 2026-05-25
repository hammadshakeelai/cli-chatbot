# 05 — UI / Theme System

The headline feature: switch the entire look at runtime via `/ui` **or** a GUI button, plus day/night, plus CRT FX.

## Theme model
A **theme/skin** bundles five things:
1. **Palette** — CSS custom-property map for `dark` and `light`, *and* a matching xterm color theme (16 ANSI + fg/bg/cursor/selection).
2. **Fonts** — monospace for the terminal (+ optional UI font). Bundled webfonts in `public/fonts` (e.g. a pixel mono for `claude-code`, IBM VGA for `dos`, a clean mono for `opencode`).
3. **Banner** — `(ctx) => string` producing the ASCII/art header + a dynamic line (model · cwd) like the reference's `Opus 4.7 (1M context) / Claude Pro / ~/Documents/asciiart`.
4. **Prompt format** — the prompt glyph/format (`> `, `❯ `, `$ `, `C:\>`…).
5. **FX flags + optional bespoke chrome** — scanlines/glow/flicker/curve, and an optional custom React chrome component for skins that need a unique layout (e.g. the `claude-code` rounded red box).

## CSS-variable contract (`tokens.css`)
All chrome styles read from a fixed set of vars so switching = swapping the map:
```
--bg --bg-elev --fg --fg-dim --accent --accent-2
--border --border-glow --selection --cursor
--font-mono --font-ui --radius --scanline-opacity --glow-strength
```
Switching theme = set `:root[data-skin][data-mode]` → these resolve. xterm theme is applied imperatively in the same tick.

## Day / Night
- Global `data-mode = 'dark' | 'light'`. Each skin defines both palettes (a light variant even for `matrix` — a "daywalker" inversion).
- Controls: `/day`, `/night`, `/mode toggle`, a header toggle button, and `Ctrl+K → "toggle day/night"`.
- Default = system `prefers-color-scheme`; once the user chooses, persist and stop following the system.
- **No FOUC:** a tiny blocking inline script in `layout.tsx` reads `localStorage` and sets `data-skin`/`data-mode` *before* React hydrates.

## CRT / visual FX layer
- An overlay component reading skin `fx` flags: scanlines (repeating-linear-gradient), glow (text-shadow/box-shadow with `--glow-strength`), flicker (subtle opacity keyframes), curvature (SVG/`border-radius` + vignette), optional chromatic aberration.
- **Hard rule:** under `prefers-reduced-motion: reduce`, disable flicker/animated FX (keep static scanlines at most). Provide a global "FX off" switch.
- Performance: FX is CSS-only where possible; the heavy curvature/aberration variant is opt-in per skin.

## Initial skin set (≥8, registry makes more trivial)
| id | vibe | notes |
|---|---|---|
| `claude-code` | **flagship**, from the reference | red rounded ASCII border box, `Welcome back` banner, pixel mascot, model/cwd lines, block cursor, "esc to interrupt" status. Bespoke chrome component. |
| `opencode` | clean modern dev TUI | restrained palette, crisp mono, minimal chrome |
| `openclaw` | playful "claw"/feral hacker | aggressive accent, glitchy banner, claw/cat ASCII mascot |
| `classic-green` | VT100 phosphor | green-on-black, scanlines on |
| `amber-crt` | 1980s amber monitor | amber glow + curvature + flicker (reduced-motion aware) |
| `matrix` | digital rain | green, faint falling-glyph background, `cmatrix`-ish idle |
| `dracula` | popular dark theme | familiar purple/pink palette |
| `synthwave` | neon 80s | magenta/cyan, strong glow, gridline banner |
| `dos` | IBM PC / Norton | blue bg, white text, IBM VGA font, box-drawing chrome |
| `hacker` | "movie hacker" | bright green, heavy glow, `hollywood` energy |

`claude-code` is built first and pixel-matched to the screenshots (red `#E5484D`-ish accent, rounded border, centered banner, pixel font). Others are mostly palette+banner+font manifests.

## Controls summary (both ways, per the brief)
- **Command:** `/ui <id>`, `/ui` (lists + interactive pick), `/theme` alias, `/day` `/night`, `/fx on|off`.
- **GUI:** header buttons (theme picker dropdown, day/night toggle, FX toggle), Settings sheet (full grid of skins with live previews), `Ctrl+K` command palette entries.

## Banner system
Each skin's `banner(ctx)` gets `{ model, providerLabel, cwd, version, mode }` and returns the header art + dynamic lines. The `claude-code` banner reproduces the reference layout; others theme it. Banner re-renders on model/cwd/skin change.

## Accessibility in theming
- Default `dark`/`light` of each skin must hit WCAG AA contrast for body text (validate in tests).
- Ship one **high-contrast** skin and ensure focus rings remain visible in all skins.
- Never encode meaning in color alone (status text + icon, not just hue).
