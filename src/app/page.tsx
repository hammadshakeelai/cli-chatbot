'use client';

import dynamic from 'next/dynamic';
import { TabBar } from '@/components/workspace/TabBar';

const XtermView = dynamic(
  () => import('@/components/terminal/XtermView').then((m) => m.XtermView),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="flex h-dvh w-dvw flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <TabBar />
      <div className="flex-1 overflow-hidden">
        <XtermView />
      </div>
    </main>
  );
}
