'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { TabBar } from '@/components/workspace/TabBar';
import { BootAnimation } from '@/components/workspace/BootAnimation';
import { CommandPalette } from '@/components/workspace/CommandPalette';

const XtermView = dynamic(
  () => import('@/components/terminal/XtermView').then((m) => m.XtermView),
  { ssr: false },
);

export default function Home() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Register service worker for PWA offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

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
