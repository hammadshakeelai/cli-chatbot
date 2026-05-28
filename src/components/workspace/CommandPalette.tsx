'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMirageStore } from '@/store';
import { ALL_SKIN_META } from '@/themes/skin-meta';

interface Action {
  id: string;
  label: string;
  category: string;
  icon?: string;
  action(): void;
}

const MODEL_ACTIONS = [
  // xAI Grok
  { id: 'xai:grok-3',           label: 'xAI: Grok 3',             category: 'Model', icon: '🌀' },
  { id: 'xai:grok-3-fast',      label: 'xAI: Grok 3 Fast',        category: 'Model', icon: '⚡' },
  { id: 'xai:grok-3-mini',      label: 'xAI: Grok 3 Mini',        category: 'Model', icon: '🌱' },
  { id: 'xai:grok-3-mini-fast', label: 'xAI: Grok 3 Mini Fast',   category: 'Model', icon: '🏎' },
  // Gemini
  { id: 'gemini:gemini-2.0-flash',      label: 'Gemini 2.0 Flash',      category: 'Model', icon: '💎' },
  { id: 'gemini:gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', category: 'Model', icon: '💎' },
  { id: 'gemini:gemini-1.5-flash',      label: 'Gemini 1.5 Flash',      category: 'Model', icon: '💎' },
  // Groq
  { id: 'groq:llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)',  category: 'Model', icon: '🦙' },
  { id: 'groq:llama-3.1-8b-instant',    label: 'Llama 3.1 8B (Groq)',   category: 'Model', icon: '🦙' },
  // OpenRouter
  { id: 'openrouter:auto:free',         label: 'OpenRouter Auto Free',  category: 'Model', icon: '🔀' },
];

const SHELL_COMMANDS = [
  'help', 'neofetch', 'clear', 'ls', 'pwd', 'history', 'date', 'cal',
  'uptime', 'ps', 'df', 'env', 'whoami', 'uname',
  'cmatrix', 'hollywood', 'sl', 'nyancat', 'bb', 'pipes', 'fortune',
  'apt list', 'apt update',
];

export function CommandPalette() {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef    = useRef<HTMLInputElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);

  const setSkin          = useMirageStore((s) => s.setSkin);
  const setMode          = useMirageStore((s) => s.setMode);
  const createSession    = useMirageStore((s) => s.createSession);
  const getActiveSession = useMirageStore((s) => s.getActiveSession);

  const setModel = useCallback((model: string) => {
    getActiveSession().chat.model = model;
  }, [getActiveSession]);

  const actions: Action[] = [
    // Theme actions
    { id: 'light', label: 'Switch to Light mode',  category: 'Theme', icon: '☀', action: () => setMode('light') },
    { id: 'dark',  label: 'Switch to Dark mode',   category: 'Theme', icon: '🌙', action: () => setMode('dark')  },
    ...ALL_SKIN_META.map((sk) => ({
      id: `skin-${sk.id}`,
      label: `Theme: ${sk.label}`,
      category: 'Skin',
      icon: '🎨',
      action: () => setSkin(sk.id),
    })),
    // Model actions
    ...MODEL_ACTIONS.map((m) => ({
      id: `model-${m.id}`,
      label: m.label,
      category: m.category,
      icon: m.icon,
      action: () => setModel(m.id),
    })),
    // New tab actions
    {
      id: 'tab-shell', label: 'New tab: Shell Terminal', category: 'Tab', icon: '💻',
      action: () => createSession('terminal'),
    },
    {
      id: 'tab-mythos', label: 'New tab: Mythos OS', category: 'Tab', icon: '☠',
      action: () => createSession('mythos', 'mythos'),
    },
    ...ALL_SKIN_META.filter((s) => s.id !== 'mythos').slice(0, 6).map((s) => ({
      id: `tab-chat-${s.id}`,
      label: `New tab: AI Chat (${s.label})`,
      category: 'Tab',
      icon: '🤖',
      action: () => createSession('chat', s.id),
    })),
    // Shell command shortcuts
    ...SHELL_COMMANDS.map((cmd) => ({
      id: `run-${cmd}`,
      label: `Run: ${cmd}`,
      category: 'Command',
      icon: '$',
      action: () => {
        setOpen(false);
        // Dispatch a custom event for XtermView to pick up
        window.dispatchEvent(new CustomEvent('mirage:run-command', { detail: cmd }));
      },
    })),
  ];

  const filtered = query.trim()
    ? actions.filter((a) => {
        const q = query.toLowerCase();
        return a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      })
    : actions;

  const close = useCallback(() => { setOpen(false); setQuery(''); setSelected(0); }, []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((p) => !p);
      setQuery('');
      setSelected(0);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      filtered[selected]!.action();
      close();
    }
  }, [open, filtered, selected, close]);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => { if (open) { inputRef.current?.focus(); setSelected(0); } }, [open]);
  useEffect(() => { setSelected(0); }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  // Group filtered results by category
  const groups: Record<string, Action[]> = {};
  for (const a of filtered) {
    (groups[a.category] ??= []).push(a);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '72px',
        paddingLeft: '12px',
        paddingRight: '12px',
        backgroundColor: 'rgba(0,0,0,0.55)',
      }}
      onClick={close}
    >
      <div
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          width: '520px',
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'min(480px, calc(100vh - 140px))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 14px', gap: '8px' }}>
          <span style={{ color: 'var(--fg-dim)', fontSize: '14px' }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search themes, models, tabs, commands…"
            style={{
              flex: 1,
              padding: '13px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--fg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <kbd style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-ui)',
            color: 'var(--fg-dim)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--fg-dim)', textAlign: 'center', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {query.trim()
            ? filtered.map((action, i) => (
                <PaletteRow
                  key={action.id}
                  action={action}
                  selected={i === selected}
                  onSelect={() => setSelected(i)}
                  onRun={() => { action.action(); close(); }}
                />
              ))
            : Object.entries(groups).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{ padding: '8px 16px 3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--fg-dim)', opacity: 0.5 }}>
                    {cat}
                  </div>
                  {items.map((action) => {
                    const globalIdx = filtered.indexOf(action);
                    return (
                      <PaletteRow
                        key={action.id}
                        action={action}
                        selected={globalIdx === selected}
                        onSelect={() => setSelected(globalIdx)}
                        onRun={() => { action.action(); close(); }}
                      />
                    );
                  })}
                </div>
              ))}
        </div>

        {/* Footer hint */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 14px', display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--fg-dim)', opacity: 0.6, fontFamily: 'var(--font-ui)' }}>
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>Esc close</span>
          <span style={{ marginLeft: 'auto' }}>Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  action,
  selected,
  onSelect,
  onRun,
}: {
  action: Action;
  selected: boolean;
  onSelect(): void;
  onRun(): void;
}) {
  return (
    <div
      onClick={onRun}
      onMouseEnter={onSelect}
      style={{
        padding: '8px 16px',
        cursor: 'pointer',
        backgroundColor: selected ? 'var(--accent)' : 'transparent',
        color: selected ? '#fff' : 'var(--fg)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        transition: 'background-color 0.08s',
      }}
    >
      {action.icon && (
        <span style={{ width: '18px', textAlign: 'center', fontSize: '14px', opacity: 0.8, flexShrink: 0 }}>
          {action.icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{action.label}</span>
      <span style={{ fontSize: '10px', opacity: 0.5 }}>{action.category}</span>
    </div>
  );
}
