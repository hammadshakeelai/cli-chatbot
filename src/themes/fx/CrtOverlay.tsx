'use client';

import { useEffect, useState } from 'react';
import { useMirageStore } from '@/store';

export function CrtOverlay() {
  const skin = useMirageStore((s) => s.skin);
  const fxEnabled = useMirageStore((s) => s.fxEnabled);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const fx = skin.fx;
  if (!fx || !fxEnabled) return null;

  const showFlicker = fx.flicker && !reducedMotion;
  const showCurvature = fx.curvature && !reducedMotion;
  const showGlow = fx.glow && !reducedMotion;

  return (
    <>
      {/* Scanlines — always shown when enabled, motion-safe */}
      {fx.scanlines && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9998,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.08) 2px,
              rgba(0,0,0,0.08) 4px
            )`,
          }}
        />
      )}

      {/* Flicker */}
      {showFlicker && (
        <div
          className="crt-flicker"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9997,
            opacity: 0.03,
            background: '#fff',
          }}
        />
      )}

      {/* Glow */}
      {showGlow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9996,
            boxShadow: `inset 0 0 60px var(--border-glow), 0 0 30px var(--border-glow)`,
          }}
        />
      )}

      {/* Curvature vignette */}
      {showCurvature && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9995,
            background: `radial-gradient(
              ellipse at center,
              transparent 60%,
              rgba(0,0,0,0.4) 100%
            )`,
          }}
        />
      )}

      <style>{`
        .crt-flicker {
          animation: crtFlicker 0.15s infinite alternate;
        }
        @keyframes crtFlicker {
          0% { opacity: 0.02; }
          100% { opacity: 0.06; }
        }
        @media (prefers-reduced-motion: reduce) {
          .crt-flicker { animation: none; display: none; }
        }
      `}</style>
    </>
  );
}
