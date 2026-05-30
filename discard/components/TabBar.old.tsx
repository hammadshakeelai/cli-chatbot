'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMirageStore, type SessionType } from '@/store';
import { ALL_SKIN_META } from '@/themes/skin-meta';

const MODEL_PRESETS_LIST = [
  { id: 'opus-4.7', label: 'Opus 4.7', desc: 'High-intelligence reasoning', icon: '🧠', color: '#8957e5' },
  { id: 'sonnet-4.7', label: 'Sonnet 4.7', desc: 'Balanced speed & quality', icon: '⚡', color: '#f38518' },
  { id: 'haiku-4.7', label: 'Haiku 4.7', desc: 'Fast & lightweight', icon: '🌱', color: '#00d4aa' },
  { id: 'claude-code-opus-4.8', label: 'Claude Code Opus 4.8', desc: 'Agentic coding expert', icon: '🤖', color: '#e5484d' },
  { id: 'kiros-4.8', label: 'Kiros 4.8', desc: 'Next-gen AI core', icon: '🌀', color: '#ff6b35' },
];

export function TabBar() {
  const sessionOrder = useMirageStore((s) => s.sessionOrder);
  const activeSessionId = useMirageStore((s) => s.activeSessionId);
  const switchSession = useMirageStore((s) => s.switchSession);
  const createSession = useMirageStore((s) => s.createSession);
  const closeSession = useMirageStore((s) => s.closeSession);
  const renameSession = useMirageStore((s) => s.renameSession);

  const reorderSessions = useMirageStore((s) => s.reorderSessions);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newTabRef = useRef<HTMLDivElement>(null);

  // All skins except mythos (mythos is its own tab type)
  const allSkins = ALL_SKIN_META.filter((s) => s.id !== 'mythos');

  // AI Chat skin options — curated set of visually distinct skins
  const chatSkins = allSkins.filter((s) =>
    ['claude-code', 'openclaw', 'opencode', 'cursor', 'copilot', 'windsurf', 'classic-green', 'matrix', 'dracula', 'amber-crt', 'synthwave', 'dos', 'hacker', 'high-contrast'].includes(s.id)
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!newTabOpen) return;
    const handler = (e: MouseEvent) => {
      if (newTabRef.current && !newTabRef.current.contains(e.target as Node)) {
        setNewTabOpen(false);
        setShowModels(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [newTabOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!newTabOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModels) {
          setShowModels(false);
        } else {
          setNewTabOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [newTabOpen, showModels]);

  const handleCreateTab = useCallback((type: SessionType, skinId?: string, modelPreset?: string) => {
    setNewTabOpen(false);
    setShowModels(false);
    createSession(type, skinId, modelPreset);
  }, [createSession]);

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

  const handleNewTabClick = useCallback(() => {
    setNewTabOpen((v) => !v);
    setShowModels(false);
  }, []);

  return (
    <div
      className="flex items-center px-1 text-sm overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-elev)',
        borderBottom: '2px solid var(--border)',
        fontFamily: 'var(--font-ui)',
        minHeight: '38px',
        gap: '2px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
      }}
    >
      {sessionOrder.map((meta, idx) => {
        const isActive = meta.id === activeSessionId;
        const isEditing = editingId === meta.id;
        const isDragOver = dragOverIdx === idx;

        const handleDragStart = (e: React.DragEvent) => {
          e.dataTransfer.setData('text/plain', String(idx));
          e.dataTransfer.effectAllowed = 'move';
          const el = e.currentTarget as HTMLElement;
          el.style.opacity = '0.4';
          el.style.cursor = 'grabbing';
        };

        const handleDragEnd = (e: React.DragEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.opacity = '1';
          el.style.cursor = 'grab';
          setDragOverIdx(null);
        };

        const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          // Only update if different to avoid unnecessary renders
          setDragOverIdx((prev) => (prev === idx ? prev : idx));
        };

        const handleDragLeave = (e: React.DragEvent) => {
          // Only clear if we actually left this tab (not just entered a child)
          const related = e.relatedTarget as Node | null;
          if (!e.currentTarget.contains(related)) {
            setDragOverIdx((prev) => (prev === idx ? null : prev));
          }
        };

        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (!isNaN(fromIdx) && fromIdx !== idx) {
            reorderSessions(fromIdx, idx);
          }
          setDragOverIdx(null);
        };

        return (
          <div
            key={meta.id}
            draggable={!isEditing}
            onClick={() => { if (!isActive && !isEditing) switchSession(meta.id); }}
            onDoubleClick={() => handleDoubleClick(meta.id, meta.label)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: isActive ? '5px 12px 4px' : '4px 12px',
              cursor: 'grab',
              backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: isActive ? 'var(--fg)' : 'var(--fg-dim)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              borderRadius: '4px 4px 0 0',
              marginTop: isActive ? '0' : '4px',
              borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.1s, margin-top 0.1s',
              borderLeft: isDragOver ? '2px solid var(--accent)' : undefined,
              opacity: isDragOver ? 0.85 : 1,
              paddingLeft: isDragOver ? '10px' : '12px',
              fontWeight: isActive ? 500 : 400,
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
                  opacity: 0.6,
                  transition: 'opacity 0.15s',
                }}
                aria-label={`Close ${meta.label}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* End drop zone — allows dropping after the last tab */}
      {sessionOrder.length > 1 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverIdx((prev) => (prev === sessionOrder.length ? prev : sessionOrder.length));
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (!e.currentTarget.contains(related)) {
              setDragOverIdx((prev) => (prev === sessionOrder.length ? null : prev));
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(fromIdx) && fromIdx !== sessionOrder.length) {
              reorderSessions(fromIdx, sessionOrder.length);
            }
            setDragOverIdx(null);
          }}
          style={{
            minWidth: dragOverIdx === sessionOrder.length ? '60px' : '12px',
            height: '28px',
            marginTop: '4px',
            borderRadius: '4px',
            transition: 'min-width 0.1s, background-color 0.1s',
            backgroundColor: dragOverIdx === sessionOrder.length ? 'var(--accent-alpha, rgba(100,100,100,0.15))' : 'transparent',
            borderLeft: dragOverIdx === sessionOrder.length ? '2px solid var(--accent)' : '2px solid transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--fg-dim)',
            fontSize: '11px',
            opacity: dragOverIdx === sessionOrder.length ? 0.8 : 0,
          }}
        >
          {dragOverIdx === sessionOrder.length && 'drop here'}
        </div>
      )}

      <div ref={newTabRef} style={{ position: 'relative' }}>
        <button
          onClick={handleNewTabClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--fg-dim)',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '18px',
            lineHeight: 1,
            opacity: newTabOpen ? 1 : 0.6,
            transition: 'opacity 0.15s, transform 0.15s',
            transform: newTabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          aria-label="New tab"
          aria-expanded={newTabOpen}
        >
          +
        </button>

        {newTabOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              zIndex: 100,
              minWidth: '300px',
              backgroundColor: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              fontFamily: 'var(--font-ui)',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
            }}
          >
            {!showModels ? (
              <>
                {/* Section: Shell */}
                <div style={{ padding: '4px 8px 2px', fontSize: '10px', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SHELL
                </div>
                <div
                  onClick={() => handleCreateTab('terminal')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-alpha, rgba(100,100,100,0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    color: 'var(--fg)',
                    transition: 'background-color 0.1s',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1, opacity: 0.8 }}>💻</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Shell Terminal</span>
                    <span style={{ fontSize: '11px', opacity: 0.5 }}>Full command-line environment</span>
                  </div>
                </div>

                {/* Section: AI Chat */}
                <div style={{ padding: '4px 8px 2px', fontSize: '10px', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  AI CHAT
                </div>
                {chatSkins.map((skin) => (
                  <div
                    key={skin.id}
                    onClick={() => {
                      // If the skin has model presets variant? No, just create with skin
                      handleCreateTab('chat', skin.id);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-alpha, rgba(100,100,100,0.12))')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      color: 'var(--fg)',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '4px',
                        backgroundColor: skin.accent,
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{skin.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.5 }}>{skin.description}</span>
                    </div>
                  </div>
                ))}

                {/* Section: Model Presets */}
                <div
                  onClick={() => setShowModels(true)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-alpha, rgba(100,100,100,0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    color: 'var(--fg)',
                    transition: 'background-color 0.1s',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1, opacity: 0.7 }}>🎯</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Model Presets</span>
                    <span style={{ fontSize: '11px', opacity: 0.5 }}>Choose an AI model →</span>
                  </div>
                </div>

                {/* Section: Mythos OS */}
                <div style={{ padding: '4px 8px 2px', fontSize: '10px', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>
                  SPECIAL
                </div>
                <div
                  onClick={() => {
                    handleCreateTab('mythos', 'mythos', 'sonnet-4.7');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(204, 34, 51, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(204, 34, 51, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    color: '#cc2233',
                    transition: 'background-color 0.15s, border-color 0.15s',
                    border: '1px solid transparent',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>☠️</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Mythos OS</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>Cyber-security rig · Phase Crab · Red/black hacking terminal</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Model Presets View */}
                <div
                  onClick={() => setShowModels(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-alpha, rgba(100,100,100,0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    color: 'var(--fg-dim)',
                    fontSize: '12px',
                    transition: 'background-color 0.1s',
                    marginBottom: '4px',
                  }}
                >
                  ← Back
                </div>
                <div style={{ padding: '0 8px 6px', fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>
                  Choose a model for your AI chat tab:
                </div>
                {MODEL_PRESETS_LIST.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleCreateTab('chat', 'opencode', preset.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-alpha, rgba(100,100,100,0.12))')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      color: 'var(--fg)',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{preset.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{preset.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.5 }}>{preset.desc}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
