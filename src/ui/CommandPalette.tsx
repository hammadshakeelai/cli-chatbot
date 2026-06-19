'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useUI } from '@/store/ui';
import { PROFILES } from '@/agents/profiles';
import { SCHEMES } from '@/themes/schemes';
import { manager } from '@/term/manager';

interface Action {
  id: string;
  label: string;
  category: string;
  icon?: string;
  iconColor?: string;
  run(): void;
}

const RUNNABLE = ['help', 'agents', 'winfetch', 'cmatrix', 'figlet hello', 'cowsay moo',
  'winget install nodejs', 'dir', 'tree /f', 'ping github.com', 'cls'];

const MODELS = ['auto', 'gemini:gemini-2.5-flash', 'gemini:gemini-2.0-flash',
  'groq:llama-3.3-70b-versatile', 'groq:llama-3.1-8b-instant', 'openrouter:auto:free'];

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPaletteOpen);
  const addTab = useUI((s) => s.addTab);
  const updateSettings = useUI((s) => s.updateSettings);
  const settings = useUI((s) => s.settings);
  const setSettingsOpen = useUI((s) => s.setSettingsOpen);
  const setAboutOpen = useUI((s) => s.setAboutOpen);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
    manager.focusActive();
  }, [setOpen]);

  const actions: Action[] = useMemo(() => [
    ...PROFILES.map((p) => ({
      id: `tab-${p.id}`,
      label: `New tab: ${p.label}`,
      category: 'Tab',
      icon: p.icon,
      iconColor: p.accent,
      run: () => addTab(p),
    })),
    ...SCHEMES.map((sc) => ({
      id: `scheme-${sc.id}`,
      label: `Color scheme: ${sc.label}`,
      category: 'Appearance',
      icon: '◧',
      iconColor: sc.dark.accent,
      run: () => updateSettings({ schemeId: sc.id }),
    })),
    {
      id: 'mode-toggle',
      label: settings.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      category: 'Appearance',
      icon: settings.mode === 'dark' ? '☀' : '☾',
      run: () => updateSettings({ mode: settings.mode === 'dark' ? 'light' : 'dark' }),
    },
    {
      id: 'fx-toggle',
      label: settings.crtFx ? 'Disable CRT effects' : 'Enable CRT effects',
      category: 'Appearance',
      icon: '▦',
      run: () => updateSettings({ crtFx: !settings.crtFx }),
    },
    ...MODELS.map((m) => ({
      id: `model-${m}`,
      label: `Model: ${m}${settings.model === m ? '  ✓' : ''}`,
      category: 'AI model',
      icon: '◇',
      run: () => updateSettings({ model: m }),
    })),
    ...RUNNABLE.map((cmd) => ({
      id: `run-${cmd}`,
      label: `Run: ${cmd}`,
      category: 'Command',
      icon: '>',
      run: () => manager.runInActive(cmd),
    })),
    { id: 'settings', label: 'Open settings', category: 'App', icon: '⚙', run: () => setSettingsOpen(true) },
    { id: 'about', label: 'About Mirage Terminal', category: 'App', icon: 'ⓘ', run: () => setAboutOpen(true) },
    {
      id: 'fullscreen', label: 'Toggle fullscreen', category: 'App', icon: '⛶',
      run: () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(() => {});
      },
    },
  ], [addTab, updateSettings, settings, setSettingsOpen, setAboutOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) =>
      a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={close} style={{ paddingTop: '70px' }}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="palette-input">
          <span style={{ color: 'var(--fg-dim)' }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tab, theme, or model…"
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); close(); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
              else if (e.key === 'Enter') {
                e.preventDefault();
                const a = filtered[selected];
                if (a) { a.run(); close(); }
              }
            }}
          />
          <span className="menu-kbd">Esc</span>
        </div>
        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div style={{ padding: '18px', textAlign: 'center', color: 'var(--fg-dim)', fontSize: '13px' }}>
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((a, i) => (
            <div
              key={a.id}
              className={`palette-row${i === selected ? ' selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => { a.run(); close(); }}
            >
              <span style={{
                width: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                color: i === selected ? '#fff' : (a.iconColor ?? 'var(--fg-dim)'), fontSize: '12px',
              }}>
                {a.icon}
              </span>
              <span>{a.label}</span>
              <span className="cat">{a.category}</span>
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span style={{ marginLeft: 'auto' }}>Ctrl+Shift+P / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
