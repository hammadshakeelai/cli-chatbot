'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMirageStore, type SessionType } from '@/store';
import { ALL_SKIN_META } from '@/themes/skin-meta';

// ── Profile definitions for the new-tab dropdown ──────────────────────────────

interface Profile {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  type: SessionType;
  skinId?: string;
}

const SHELL_PROFILES: Profile[] = [
  { id: 'shell',     label: 'Shell',          sublabel: 'Default terminal',       icon: '>_',  color: '#00d4aa', type: 'terminal' },
  { id: 'powershell',label: 'PowerShell',     sublabel: 'PS-style terminal',      icon: 'PS',  color: '#4a90e2', type: 'terminal' },
];

const AI_PROFILES: Profile[] = ALL_SKIN_META
  .filter((s) => s.id !== 'mythos')
  .map((s) => ({
    id:       s.id,
    label:    s.label,
    sublabel: s.description,
    icon:     s.id === 'claude-code'  ? 'CC'
            : s.id === 'copilot'      ? 'GH'
            : s.id === 'cursor'       ? '❯'
            : s.id === 'windsurf'     ? '🌊'
            : s.id === 'opencode'     ? '<>'
            : s.id === 'hacker'       ? '#'
            : s.id === 'matrix'       ? '01'
            : s.id === 'dos'          ? 'C:'
            : s.id === 'dracula'      ? '✦'
            : s.id === 'synthwave'    ? '◈'
            : s.id === 'amber-crt'    ? '>_'
            : s.id === 'classic-green'? '$'
            : s.id === 'high-contrast'? 'A+'
            : s.id === 'openclaw'     ? '❯'
            : '◆',
    color:    s.accent,
    type:     'chat' as SessionType,
    skinId:   s.id,
  }));

const SPECIAL_PROFILES: Profile[] = [
  { id: 'mythos', label: 'Mythos OS', sublabel: 'Cyber-security rig · Phase Crab', icon: '☠', color: '#cc2233', type: 'mythos', skinId: 'mythos' },
];

// ── Tab icon / color helpers ──────────────────────────────────────────────────

function getTabAccent(type: SessionType, tabSkin: string | null): string {
  if (type === 'mythos') return '#cc2233';
  if (type === 'chat' && tabSkin) {
    return ALL_SKIN_META.find((s) => s.id === tabSkin)?.accent ?? '#58a6ff';
  }
  return '#00d4aa';
}

function getTabIcon(type: SessionType, tabSkin: string | null): string {
  if (type === 'mythos') return '☠';
  if (type === 'terminal') return '>_';
  if (type === 'chat') {
    const p = AI_PROFILES.find((p) => p.skinId === tabSkin);
    return p?.icon ?? '◆';
  }
  return '◆';
}

// ── ProfileItem helper component ─────────────────────────────────────────────

function ProfileItem({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '10px',
        width:           '100%',
        padding:         '7px 12px',
        background:      hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        border:          'none',
        borderRadius:    '5px',
        cursor:          'pointer',
        textAlign:       'left',
        transition:      'background 0.12s',
        color:           'inherit',
      }}
    >
      {/* Icon badge */}
      <span
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          '28px',
          height:         '28px',
          borderRadius:   '6px',
          backgroundColor: profile.color + '22',
          border:         `1px solid ${profile.color}44`,
          color:          profile.color,
          fontSize:       '11px',
          fontWeight:     700,
          fontFamily:     'monospace',
          flexShrink:     0,
          letterSpacing:  '-0.5px',
        }}
      >
        {profile.icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
          {profile.label}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--fg-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {profile.sublabel}
        </span>
      </div>
    </button>
  );
}

// ── Main TabBar ────────────────────────────────────────────────────────────────

export function TabBar() {
  const sessionOrder    = useMirageStore((s) => s.sessionOrder);
  const sessions        = useMirageStore((s) => s.sessions);
  const activeSessionId = useMirageStore((s) => s.activeSessionId);
  const switchSession   = useMirageStore((s) => s.switchSession);
  const createSession   = useMirageStore((s) => s.createSession);
  const closeSession    = useMirageStore((s) => s.closeSession);
  const renameSession   = useMirageStore((s) => s.renameSession);

  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [editingId,    setEditingId]      = useState<string | null>(null);
  const [editValue,    setEditValue]      = useState('');
  const [hoveredId,    setHoveredId]      = useState<string | null>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Escape closes dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dropdownOpen]);

  const openProfile = useCallback((profile: Profile) => {
    setDropdownOpen(false);
    createSession(profile.type, profile.skinId);
  }, [createSession]);

  const startRename = useCallback((id: string, label: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditValue(label);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 10);
  }, []);

  const commitRename = useCallback((id: string) => {
    const v = editValue.trim();
    if (v) renameSession(id, v);
    setEditingId(null);
  }, [editValue, renameSession]);

  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'stretch',
        backgroundColor: 'var(--bg-elev)',
        borderBottom:    '1px solid var(--border)',
        height:          '40px',
        flexShrink:      0,
        overflowX:       'auto',
        overflowY:       'hidden',
        scrollbarWidth:  'none',
        userSelect:      'none',
        fontFamily:      'var(--font-ui, system-ui, sans-serif)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── Tabs ─────────────────────────────────────────────────── */}
      {sessionOrder.map((meta) => {
        const session  = sessions[meta.id];
        const type     = session?.type ?? 'terminal';
        const tabSkin  = session?.tabSkin ?? null;
        const isActive = meta.id === activeSessionId;
        const isEditing = editingId === meta.id;
        const isHovered = hoveredId === meta.id;
        const accent   = getTabAccent(type, tabSkin);
        const icon     = getTabIcon(type, tabSkin);

        return (
          <div
            key={meta.id}
            onMouseEnter={() => setHoveredId(meta.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => { if (!isEditing) switchSession(meta.id); }}
            onDoubleClick={(e) => startRename(meta.id, meta.label, e)}
            style={{
              position:        'relative',
              display:         'flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '0 10px 0 12px',
              cursor:          'default',
              flexShrink:      0,
              maxWidth:        '180px',
              minWidth:        '100px',
              // Windows Terminal tab look: active tab connects to terminal below
              backgroundColor: isActive
                ? 'var(--bg)'
                : isHovered
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
              borderRight:     '1px solid var(--border)',
              // Active tab gets accent top strip
              borderTop:       isActive
                ? `2px solid ${accent}`
                : '2px solid transparent',
              // Active tab covers the bottom border (connects to terminal)
              marginBottom:    isActive ? '-1px' : '0',
              zIndex:          isActive ? 2 : 1,
              transition:      'background-color 0.1s, border-color 0.12s',
            }}
          >
            {/* Tab icon */}
            <span
              style={{
                fontSize:   '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color:      isActive ? accent : 'var(--fg-dim)',
                opacity:    isActive ? 1 : 0.6,
                letterSpacing: '-0.5px',
                flexShrink: 0,
                transition: 'color 0.1s',
              }}
            >
              {icon}
            </span>

            {/* Tab label (or rename input) */}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitRename(meta.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(meta.id);
                  if (e.key === 'Escape') setEditingId(null);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex:        1,
                  background:  'var(--bg)',
                  color:       'var(--fg)',
                  border:      '1px solid var(--accent)',
                  borderRadius: '3px',
                  outline:     'none',
                  fontSize:    '12px',
                  fontFamily:  'var(--font-ui)',
                  padding:     '1px 4px',
                  width:       '90px',
                }}
              />
            ) : (
              <span
                style={{
                  flex:         1,
                  fontSize:     '12px',
                  fontWeight:   isActive ? 500 : 400,
                  color:        isActive ? 'var(--fg)' : 'var(--fg-dim)',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  transition:   'color 0.1s',
                }}
              >
                {meta.label}
              </span>
            )}

            {/* Close button — only visible on hover or if active */}
            {!isEditing && (isHovered || isActive) && sessionOrder.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeSession(meta.id); }}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '16px',
                  height:         '16px',
                  borderRadius:   '3px',
                  background:     'transparent',
                  border:         'none',
                  color:          'var(--fg-dim)',
                  cursor:         'pointer',
                  fontSize:       '13px',
                  lineHeight:     1,
                  flexShrink:     0,
                  transition:     'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,80,0.18)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ff6b6b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-dim)';
                }}
                title={`Close ${meta.label}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* ── New tab button + dropdown ──────────────────────────── */}
      <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          title="New tab"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '2px',
            height:         '100%',
            padding:        '0 10px',
            background:     'transparent',
            border:         'none',
            borderRight:    '1px solid var(--border)',
            color:          'var(--fg-dim)',
            cursor:         'pointer',
            fontSize:       '18px',
            lineHeight:     1,
            transition:     'background 0.1s, color 0.1s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-dim)';
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '-1px' }}>+</span>
          <span style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>▾</span>
        </button>

        {/* ── Dropdown panel ───────────────────────────────────── */}
        {dropdownOpen && (
          <div
            style={{
              position:        'absolute',
              top:             'calc(100% + 4px)',
              left:            '0',
              zIndex:          1000,
              width:           '280px',
              backgroundColor: 'var(--bg-elev)',
              border:          '1px solid var(--border)',
              borderRadius:    '10px',
              boxShadow:       '0 12px 40px rgba(0,0,0,0.5)',
              overflow:        'hidden',
              fontFamily:      'var(--font-ui, system-ui)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                New Tab
              </span>
            </div>

            <div style={{ padding: '6px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', scrollbarWidth: 'thin' }}>

              {/* Shell section */}
              <div style={{ padding: '6px 8px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6 }}>
                Shell
              </div>
              {SHELL_PROFILES.map((p) => (
                <ProfileItem key={p.id} profile={p} onClick={() => openProfile(p)} />
              ))}

              <div style={{ height: '1px', background: 'var(--border)', margin: '6px 2px' }} />

              {/* AI section */}
              <div style={{ padding: '6px 8px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6 }}>
                AI Agents
              </div>
              {AI_PROFILES.map((p) => (
                <ProfileItem key={p.id} profile={p} onClick={() => openProfile(p)} />
              ))}

              <div style={{ height: '1px', background: 'var(--border)', margin: '6px 2px' }} />

              {/* Special section */}
              <div style={{ padding: '6px 8px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6 }}>
                Special
              </div>
              {SPECIAL_PROFILES.map((p) => (
                <ProfileItem key={p.id} profile={p} onClick={() => openProfile(p)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spacer to push remaining space right */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
