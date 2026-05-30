'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useMirageStore } from '@/store';
import { TabBar }         from '@/components/workspace/TabBar';
import { AiPanel }        from '@/components/workspace/AiPanel';
import { CommandPalette } from '@/components/workspace/CommandPalette';

// Lazy-load xterm.js (browser-only)
const XtermView = dynamic(
  () => import('@/components/terminal/XtermView').then((m) => m.XtermView),
  { ssr: false, loading: () => null },
);

export default function Home() {
  const setSkin        = useMirageStore((s) => s.setSkin);
  const aiPanelVisible = useMirageStore((s) => s.aiPanelVisible);

  useEffect(() => {
    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Restore persisted skin preference
    const stored = localStorage.getItem('mirage-skin');
    if (stored && stored !== 'claude-code') {
      setSkin(stored).catch(() => {});
    }
  }, [setSkin]);

  return (
    <main
      style={{
        display:         'flex',
        flexDirection:   'column',
        height:          '100dvh',
        width:           '100dvw',
        overflow:        'hidden',
        backgroundColor: 'var(--bg)',
        // Padding-bottom when AI panel is open so terminal isn't obscured
        paddingBottom:   aiPanelVisible ? '0' : '0',
      }}
    >
      {/* Command palette (Ctrl+P) */}
      <CommandPalette />

      {/* Windows Terminal-style tab bar */}
      <TabBar />

      {/* Terminal content — fills remaining space */}
      <div
        style={{
          flex:     1,
          overflow: 'hidden',
          display:  'flex',
          flexDirection: 'column',
          // When AI panel is visible, shrink terminal to make room
          minHeight: 0,
        }}
      >
        <XtermView />
      </div>

      {/* Agentic AI popup panel */}
      <AiPanel />
    </main>
  );
}
