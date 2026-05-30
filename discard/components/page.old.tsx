'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useMirageStore } from '@/store';
import { TabBar } from '@/components/workspace/TabBar';
import { BootAnimation } from '@/components/workspace/BootAnimation';
import { CommandPalette } from '@/components/workspace/CommandPalette';

const XtermView = dynamic(
  () => import('@/components/terminal/XtermView').then((m) => m.XtermView),
  { ssr: false },
);

export default function Home() {
  const [booted, setBooted] = useState(false);

  const setSkin = useMirageStore((s) => s.setSkin);

  useEffect(() => {
    // Register service worker for PWA offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Restore persisted skin (dynamically loaded)
    const stored = localStorage.getItem('mirage-skin');
    if (stored && stored !== 'claude-code') {
      setSkin(stored).catch(() => {});
    }
  }, [setSkin]);

  return (
    <main className="flex h-dvh w-dvw flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {!booted && <BootAnimation onDone={() => setBooted(true)} />}
      <CommandPalette />
      <TabBar />
      <div className="flex-1 overflow-hidden">
        <XtermView key={booted ? 'ready' : 'waiting'} />
      </div>
    </main>
  );
}
