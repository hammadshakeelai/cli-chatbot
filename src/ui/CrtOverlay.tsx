'use client';

import { useUI } from '@/store/ui';

export function CrtOverlay() {
  const crtFx = useUI((s) => s.settings.crtFx);
  if (!crtFx) return null;
  return <div className="crt" aria-hidden="true" />;
}
