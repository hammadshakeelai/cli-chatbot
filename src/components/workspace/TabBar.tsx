'use client';

import { useCallback, useRef, useState } from 'react';
import { useMirageStore } from '@/store';

export function TabBar() {
  const sessionOrder = useMirageStore((s) => s.sessionOrder);
  const activeSessionId = useMirageStore((s) => s.activeSessionId);
  const switchSession = useMirageStore((s) => s.switchSession);
  const createSession = useMirageStore((s) => s.createSession);
  const closeSession = useMirageStore((s) => s.closeSession);
  const renameSession = useMirageStore((s) => s.renameSession);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((id: string, label: string) => {
    setEditingId(id);
    setEditValue(label);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleRename = useCallback((id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) renameSession(id, trimmed);
    setEditingId(null);
  }, [editValue, renameSession]);

  return (
    <div
      className="flex items-center gap-0 border-b px-1 text-sm"
      style={{
        backgroundColor: 'var(--bg-elev)',
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-ui)',
        minHeight: '36px',
      }}
    >
      {sessionOrder.map((meta) => {
        const isActive = meta.id === activeSessionId;
        const isEditing = editingId === meta.id;

        return (
          <div
            key={meta.id}
            onClick={() => { if (!isActive && !isEditing) switchSession(meta.id); }}
            onDoubleClick={() => handleDoubleClick(meta.id, meta.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              cursor: 'pointer',
              borderRight: '1px solid var(--border)',
              backgroundColor: isActive ? 'var(--bg)' : 'transparent',
              color: isActive ? 'var(--fg)' : 'var(--fg-dim)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRename(meta.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(meta.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--accent)',
                  outline: 'none',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  width: '100px',
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{meta.label}</span>
            )}
            {sessionOrder.length > 1 && !isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); closeSession(meta.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-dim)',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
                aria-label={`Close ${meta.label}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={createSession}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--fg-dim)',
          cursor: 'pointer',
          padding: '4px 10px',
          fontSize: '16px',
          lineHeight: 1,
        }}
        aria-label="New terminal tab"
      >
        +
      </button>
    </div>
  );
}
