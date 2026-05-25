'use client';

import dynamic from 'next/dynamic';

const XtermView = dynamic(
  () => import('@/components/terminal/XtermView').then((m) => m.XtermView),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="h-dvh w-dvw overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <XtermView />
    </main>
  );
}
