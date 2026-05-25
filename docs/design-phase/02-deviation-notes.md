# Sprint 0 Deviation Notes

## 2026-05-25 — Dependency version pinning

The spec listed approximate versions (Next.js 15, xterm 5.5, etc.). The actual latest versions available at install time differ slightly:

| Package | Spec | Actual |
|---|---|---|
| next | ^15.2.0 | ^15.5.18 |
| xterm | ^5.5.0 | ^5.3.0 (deprecated; @xterm/xterm@6.x is the replacement — migrate in a later sprint) |
| @xterm/addon-fit | ^0.10.0 | ^0.11.0 |
| @xterm/addon-web-links | ^0.11.0 | ^0.12.0 |
| @xterm/addon-search | ^0.15.0 | ^0.16.0 |
| @xterm/addon-webgl | ^0.18.0 | ^0.19.0 |
| zustand | ^5.0.0 | ^5.0.13 |
| tailwindcss | ^4.0.0 | ^4.3.0 |
| @tailwindcss/postcss | ^4.0.0 | ^4.3.0 |
| vitest | ^3.0.0 | ^3.2.4 |
| @playwright/test | ^1.52.0 | ^1.60.0 |
| eslint-config-next | ^15.2.0 | ^15.5.18 |
| prettier-plugin-tailwindcss | ^0.6.0 | ^0.8.0 |
| @vitejs/plugin-react | ^4.4.0 | ^4.7.0 |
| jsdom | ^26.0.0 | ^26.1.0 |

All are compatible within the same major version range.

## 2026-05-25 — xterm package moved to @xterm/xterm

Since the spec was written, xterm.js migrated from the `xterm` npm package to `@xterm/xterm@6`. We stay on `xterm@5.3.0` for Sprint 0 (fully functional, just deprecated). Migration to `@xterm/xterm` should be done before Sprint 5 (theme engine) to align with the latest addon ecosystem.

## 2026-05-25 — No `tailwind.config.ts` (Tailwind v4 CSS-first config)

Tailwind v4 dropped the JS config file in favor of CSS-native `@theme` directives. Theme custom properties are defined in `globals.css`.

## 2026-05-25 — Project scaffolded in `mirage-terminal/` subdirectory

## 2026-05-25 — System monospace font stack

Custom fonts deferred to Sprint 5 (theme engine). Using system fallback stack for now.

## 2026-05-25 � xterm SSR fix

The xterm package uses browser globals (self) and cannot be server-side rendered.
The XtermView component is loaded via next/dynamic with ssr: false. This requires
the page.tsx to be a Client Component ('use client'). The page renders as a static
export with an empty shell that hydrates on the client.

