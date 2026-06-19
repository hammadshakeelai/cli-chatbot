'use client';

import { useEffect } from 'react';
import { useUI } from '@/store/ui';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { AGENTS } from '@/agents/registry';

/** Windows Terminal-style "close all tabs?" confirmation. */
export function ConfirmCloseDialog() {
  const open = useUI((s) => s.confirmCloseOpen);
  const setOpen = useUI((s) => s.setConfirmCloseOpen);
  const closeAllTabs = useUI((s) => s.closeAllTabs);
  const tabs = useUI((s) => s.tabs);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={() => setOpen(false)} style={{ alignItems: 'center', paddingTop: 0 }}>
      <div className="dialog" style={{ width: 420 }} onMouseDown={(e) => e.stopPropagation()} role="alertdialog">
        <div className="dialog-header">Do you want to close all tabs?</div>
        <div className="dialog-body" style={{ color: 'var(--fg-dim)', fontSize: '13px', lineHeight: 1.6 }}>
          {tabs.length === 1 ? 'This window has 1 tab open.' : `This window has ${tabs.length} tabs open.`} Sessions
          are simulated — closing resets them and opens a fresh PowerShell tab.
        </div>
        <div className="dialog-footer">
          <button className="btn" onClick={() => setOpen(false)} autoFocus>Cancel</button>
          <button className="btn primary" onClick={() => closeAllTabs()}>Close all tabs</button>
        </div>
      </div>
    </div>
  );
}

export function AboutDialog() {
  const open = useUI((s) => s.aboutOpen);
  const setOpen = useUI((s) => s.setAboutOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={() => setOpen(false)}>
      <div className="dialog" style={{ width: 480 }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="About">
        <div className="dialog-header">
          About {APP_NAME}
          <button className="dialog-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="dialog-body" style={{ fontSize: '13px', lineHeight: 1.65 }}>
          <p style={{ marginTop: 0 }}>
            <strong>{APP_NAME}</strong> <span style={{ color: 'var(--fg-dim)' }}>v{APP_VERSION}</span> —
            a PowerShell that isn&rsquo;t there.
          </p>
          <p style={{ color: 'var(--fg-dim)' }}>
            A simulated Windows terminal in your browser. The shell, the filesystem, and the
            agents&rsquo; tool calls are theater — but the AI replies are real, streamed from free
            LLM providers through a server-side proxy. Nothing touches your actual machine.
          </p>
          <p style={{ marginBottom: '6px' }}><strong>AI agent CLIs</strong></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {AGENTS.map((a) => (
              <span key={a.id}>
                <span style={{ color: a.accent }}>{a.icon}</span> {a.command}
              </span>
            ))}
          </div>
          <p style={{ marginBottom: '6px', marginTop: '14px' }}><strong>Keyboard</strong></p>
          <div style={{ color: 'var(--fg-dim)', fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 14px' }}>
            <span>Ctrl+Shift+P / Ctrl+K</span><span>command palette</span>
            <span>Ctrl+,</span><span>settings</span>
            <span>Alt+T / Alt+W</span><span>new / close tab</span>
            <span>Alt+1…8</span><span>jump to tab</span>
            <span>Esc / Ctrl+C</span><span>interrupt a running command</span>
            <span>Tab</span><span>complete commands &amp; paths</span>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn primary" onClick={() => setOpen(false)}>Nice</button>
        </div>
      </div>
    </div>
  );
}
