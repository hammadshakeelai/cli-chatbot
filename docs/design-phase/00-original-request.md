# 00 — Original Request (preserved verbatim)

This is the founding brief, kept exactly as given so intent is never lost.

> i want to build a cli chatbot using free api but i want to make vhanging ui with my choice using /ui command or gui button
> Also a night day button to change feom dark mode
> Ui includes openclaw ui
> Freebuff opencode
> Or many other type of cli based chatbot ui inside a virtual linux base terminal where literally all commands work robust and apt install too but in reality those things are already built in the code like hollywood cmatrix figlet and many other this is a large scale project so plan big and detail like that
> The terminal of chatbot also is multi tabable so more tables can be open all through a free api's and following agile model of SE look at the example image in the repo and make a spec reccord in repo folder with documentation inside that store every single bit and resoning their and remember this jas to be deployed somewhere so plan it accordingly and be sure tick all boxes before starting to developing think super super deep and problem solve all problems robustly before hand
> Write a super good plan for all this and good features like if you can
> This is a virtual feel good like chatbot with dynamic ui options and also add in the prompt for all this in storing the plan and this prompt and all chat in a design phase folder
> You opus have to write a prompt for all this for opencode on my computer

## Reference image (the "example image in the repo")

Two screenshots of an Instagram post by `vagonparovoz` showing a **stylized Claude Code TUI**. This is the *primary visual reference* for the flagship UI skin.

What the reference shows:
- A **red rounded ASCII border** box labelled **`Claude Code`** in red at the top-left of the border.
- Centered banner text: **`Welcome back V!`**
- A **red pixel-art mascot** (a blocky pig/creature with two eyes and little legs).
- Three centered info lines: **`Opus 4.7 (1M context)`**, **`Claude Pro`**, **`~/Documents/asciiart`**.
- A horizontal rule, then a prompt line beginning with `>` containing a user command:
  *"draw a skull in high-ASCII style, ~ 16 rows x 20 cols, using $ as the base character"*
- A second prompt with a block cursor, a status line **`Honking…`** (yellow/red), and **`esc to interrupt`** at the bottom.
- Monospace pixel font, mostly black background, red accent.

### How the reference maps to features
| Reference element | Mirage feature it inspires |
|---|---|
| Red bordered `Claude Code` box | The **`claude-code` UI skin** (flagship, recreated faithfully) |
| `Welcome back V!` + mascot + model lines | **Banner system** per skin (ASCII art + dynamic model/cwd line) |
| `> draw a skull…` prompt | **Prompt component** + AI chat input |
| `Honking…` + `esc to interrupt` | **Streaming status indicator** + **Esc-to-interrupt** on long ops/animations |
| Pixel monospace font, scanline vibe | **CRT FX layer** + per-skin font tokens |
| Mobile screenshot | **Mobile-first responsiveness** is a hard requirement |

### Interpreting the loosely-named UIs
The brief mentions `openclaw ui` and `Freebuff opencode` among "many other types." These are treated as **named entries in a pluggable theme registry** rather than fixed external products — the architecture makes adding/renaming a skin a ~20-line manifest, so whatever the exact names, they're trivially supported. Initial skin set is defined in `docs/spec/05-ui-themes.md`.
