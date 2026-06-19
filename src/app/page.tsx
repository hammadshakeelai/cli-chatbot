'use client';

import { useEffect } from 'react';
import { useUI } from '@/store/ui';
import { SHELL_PROFILE } from '@/agents/profiles';
import { WindowChrome } from '@/ui/WindowChrome';
import { TerminalMount } from '@/ui/TerminalMount';
import { StatusBar } from '@/ui/StatusBar';
import { SettingsDialog } from '@/ui/SettingsDialog';
import { CommandPalette } from '@/ui/CommandPalette';
import { ConfirmCloseDialog, AboutDialog } from '@/ui/Dialogs';
import { MobileKeyBar } from '@/ui/MobileKeyBar';
import { Toasts } from '@/ui/Toasts';
import { CrtOverlay } from '@/ui/CrtOverlay';

export default function Home() {
  const tabs = useUI((s) => s.tabs);
  const addTab = useUI((s) => s.addTab);

  // Always keep at least one tab (also restores after "close all tabs")
  useEffect(() => {
    if (tabs.length === 0) addTab(SHELL_PROFILE);
  }, [tabs.length, addTab]);

  // Remove any stale service workers from the previous version of the app.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => { r.unregister().catch(() => {}); }))
        .catch(() => {});
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => { caches.delete(k).catch(() => {}); })).catch(() => {});
      }
    }
  }, []);

  // Global shortcuts (capture phase so the terminal doesn't swallow them)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      const ctrl = e.ctrlKey || e.metaKey;

      if ((ctrl && e.shiftKey && e.key.toLowerCase() === 'p') || (ctrl && !e.shiftKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        e.stopPropagation();
        ui.setPaletteOpen(!ui.paletteOpen);
        return;
      }
      if (ctrl && e.key === ',') {
        e.preventDefault();
        e.stopPropagation();
        ui.setSettingsOpen(!ui.settingsOpen);
        return;
      }
      if (e.altKey && !ctrl) {
        const k = e.key.toLowerCase();
        if (k === 't') {
          e.preventDefault(); e.stopPropagation();
          ui.addTab(SHELL_PROFILE);
          return;
        }
        if (k === 'w') {
          e.preventDefault(); e.stopPropagation();
          ui.closeTab(ui.activeTabId);
          return;
        }
        if (/^[1-8]$/.test(k)) {
          const idx = Number(k) - 1;
          const tab = ui.tabs[idx];
          if (tab) {
            e.preventDefault(); e.stopPropagation();
            ui.activateTab(tab.id);
          }
          return;
        }
        if (k === 'arrowright') { e.preventDefault(); e.stopPropagation(); ui.cycleTab(1); return; }
        if (k === 'arrowleft') { e.preventDefault(); e.stopPropagation(); ui.cycleTab(-1); return; }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  return (
    <main className="app-frame">
      <WindowChrome />
      <TerminalMount />
      <MobileKeyBar />
      <StatusBar />
      <SettingsDialog />
      <CommandPalette />
      <ConfirmCloseDialog />
      <AboutDialog />
      <Toasts />
      <CrtOverlay />
    </main>
  );
}
