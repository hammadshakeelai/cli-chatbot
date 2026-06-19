'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUI } from '@/store/ui';
import { PROFILES, SHELL_PROFILE, profileById } from '@/agents/profiles';
import type { Profile } from '@/agents/profiles';
import { manager } from '@/term/manager';

interface CtxMenu { x: number; y: number; tabId: string; }

export function WindowChrome() {
  const tabs = useUI((s) => s.tabs);
  const activeTabId = useUI((s) => s.activeTabId);
  const activateTab = useUI((s) => s.activateTab);
  const addTab = useUI((s) => s.addTab);
  const closeTab = useUI((s) => s.closeTab);
  const renameTab = useUI((s) => s.renameTab);
  const setSettingsOpen = useUI((s) => s.setSettingsOpen);
  const setAboutOpen = useUI((s) => s.setAboutOpen);
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);
  const setConfirmCloseOpen = useUI((s) => s.setConfirmCloseOpen);
  const toast = useUI((s) => s.toast);

  const [menuOpen, setMenuOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  // Close popups on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !ctxMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
      setCtxMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setCtxMenu(null); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, ctxMenu]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const openProfile = useCallback((p: Profile) => {
    setMenuOpen(false);
    addTab(p);
  }, [addTab]);

  const startRename = useCallback((tabId: string, current: string) => {
    setCtxMenu(null);
    setEditingId(tabId);
    setEditValue(current);
    setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 20);
  }, []);

  const commitRename = useCallback((tabId: string) => {
    const v = editValue.trim();
    if (v) renameTab(tabId, v);
    setEditingId(null);
    manager.focusActive();
  }, [editValue, renameTab]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const shellProfiles = PROFILES.filter((p) => p.kind === 'shell');
  const agentProfiles = PROFILES.filter((p) => p.kind === 'agent');

  return (
    <div className="titlebar">
      {/* ── Tabs ── */}
      <div className="tab-strip">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`tab${isActive ? ' active' : ''}`}
              onMouseDown={(e) => {
                if (e.button === 1) { e.preventDefault(); closeTab(tab.id); return; }
                if (e.button === 0 && editingId !== tab.id) activateTab(tab.id);
              }}
              onDoubleClick={() => startRename(tab.id, tab.title)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
              }}
              title={tab.title}
            >
              <span className="tab-icon" style={{ color: tab.accent }}>{tab.icon}</span>
              {editingId === tab.id ? (
                <input
                  ref={editRef}
                  className="tab-rename"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitRename(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(tab.id);
                    if (e.key === 'Escape') setEditingId(null);
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="tab-title">{tab.title}</span>
              )}
              {tab.busy && <span className="tab-busy" style={{ background: tab.accent }} />}
              <button
                className="tab-close"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close tab"
                aria-label={`Close ${tab.title}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* ── New tab + profile menu ── */}
      <button
        className="titlebar-btn"
        onClick={() => addTab(SHELL_PROFILE)}
        title="New tab (PowerShell)"
        aria-label="New tab"
        style={{ fontSize: '16px' }}
      >
        +
      </button>
      <div ref={menuRef} style={{ position: 'relative', display: 'flex' }}>
        <button
          className="titlebar-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="Open a new tab with a profile"
          aria-label="Profile menu"
          style={{ width: '22px', fontSize: '10px' }}
        >
          ⌄
        </button>
        {menuOpen && (
          <div className="menu" style={{ left: '-180px' }}>
            <div className="menu-section">Shells</div>
            {shellProfiles.map((p) => <ProfileRow key={p.id} p={p} onClick={() => openProfile(p)} />)}
            <div className="menu-divider" />
            <div className="menu-section">AI agents</div>
            {agentProfiles.map((p) => <ProfileRow key={p.id} p={p} onClick={() => openProfile(p)} />)}
            <div className="menu-divider" />
            <button className="menu-item" onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}>
              <span className="menu-icon" style={{ color: 'var(--fg-dim)' }}>⚙</span>
              <span className="menu-label">Settings</span>
              <span className="menu-kbd">Ctrl+,</span>
            </button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); setPaletteOpen(true); }}>
              <span className="menu-icon" style={{ color: 'var(--fg-dim)' }}>⌘</span>
              <span className="menu-label">Command palette</span>
              <span className="menu-kbd">Ctrl+Shift+P</span>
            </button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); setAboutOpen(true); }}>
              <span className="menu-icon" style={{ color: 'var(--fg-dim)' }}>ⓘ</span>
              <span className="menu-label">About Mirage Terminal</span>
            </button>
          </div>
        )}
      </div>

      <div className="drag-region" onDoubleClick={toggleFullscreen} />

      {/* ── Window controls ── */}
      <div className="window-controls">
        <button
          className="window-btn"
          title="Minimize"
          aria-label="Minimize"
          onClick={() => toast('This window has commitment issues with minimizing. It stays.')}
        >
          ─
        </button>
        <button
          className="window-btn"
          title={isFullscreen ? 'Restore' : 'Maximize'}
          aria-label="Maximize"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? '❐' : '▢'}
        </button>
        <button
          className="window-btn close"
          title="Close"
          aria-label="Close window"
          onClick={() => setConfirmCloseOpen(true)}
        >
          ✕
        </button>
      </div>

      {/* ── Tab context menu ── */}
      {ctxMenu && (
        <div
          className="menu context-menu"
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 230), top: ctxMenu.y, minWidth: 200 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="menu-item" onClick={() => {
            const t = tabs.find((t2) => t2.id === ctxMenu.tabId);
            if (t) startRename(t.id, t.title);
          }}>
            <span className="menu-label">Rename tab</span>
          </button>
          <button className="menu-item" onClick={() => {
            const t = tabs.find((t2) => t2.id === ctxMenu.tabId);
            if (t) addTab(profileById(t.profileId));
            setCtxMenu(null);
          }}>
            <span className="menu-label">Duplicate tab</span>
          </button>
          <div className="menu-divider" />
          <button className="menu-item" onClick={() => { closeTab(ctxMenu.tabId); setCtxMenu(null); }}>
            <span className="menu-label">Close tab</span>
          </button>
          <button className="menu-item" onClick={() => {
            for (const t of tabs) if (t.id !== ctxMenu.tabId) closeTab(t.id);
            activateTab(ctxMenu.tabId);
            setCtxMenu(null);
          }}>
            <span className="menu-label">Close other tabs</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ p, onClick }: { p: Profile; onClick(): void }) {
  return (
    <button className="menu-item" onClick={onClick}>
      <span
        className="menu-icon"
        style={{ color: p.accent, background: p.accent + '1f', border: `1px solid ${p.accent}44` }}
      >
        {p.icon}
      </span>
      <span className="menu-label">
        {p.label}
        <small>{p.sublabel}</small>
      </span>
    </button>
  );
}
