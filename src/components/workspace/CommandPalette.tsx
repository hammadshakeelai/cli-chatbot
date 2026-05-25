'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMirageStore } from '@/store';
import { listSkins } from '@/themes/registry';

interface Action {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action(): void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const setSkin = useMirageStore((s) => s.setSkin);
  const setMode = useMirageStore((s) => s.setMode);
  const skins = listSkins();

  const actions: Action[] = [
    { id: 'day', label: 'Switch to light mode', category: 'Theme', action: () => setMode('light') },
    { id: 'night', label: 'Switch to dark mode', category: 'Theme', action: () => setMode('dark') },
    ...skins.map((sk) => ({
      id: `skin-${sk.id}`,
      label: `Switch skin: ${sk.label}`,
      category: 'Skin',
      action: () => setSkin(sk.id),
    })),
  ];

  const filtered = query.trim()
    ? actions.filter((a) => {
        const q = query.toLowerCase();
        return a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      })
    : actions;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelected(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        filtered[selected]!.action();
        setOpen(false);
      }
    },
    [open, filtered, selected],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '80px',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={resultsRef}
        style={{
          background: 'var(--bg-elev, #1a1a1a)',
          border: '1px solid var(--border, #333)',
          borderRadius: '12px',
          width: '480px',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actions..."
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border, #333)',
            color: 'var(--fg, #e0e0e0)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--fg-dim, #888)', textAlign: 'center', fontFamily: 'var(--font-mono, monospace)' }}>
              No results.
            </div>
          )}
          {filtered.map((action, i) => (
            <div
              key={action.id}
              onClick={() => { action.action(); setOpen(false); }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: i === selected ? 'var(--accent, #e5484d)' : 'transparent',
                color: i === selected ? '#fff' : 'var(--fg, #e0e0e0)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <span>{action.label}</span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>{action.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
