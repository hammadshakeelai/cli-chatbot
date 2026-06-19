import { create } from 'zustand';
import { loadJSON, saveJSON } from '@/lib/persist';
import { DEFAULT_SCHEME_ID } from '@/themes/schemes';

export interface TabMeta {
  id: string;
  /** Live title (process-controlled, like a real terminal). */
  title: string;
  /** True once the user manually renamed the tab — live titles stop overriding it. */
  pinnedTitle: boolean;
  profileId: string;
  icon: string;
  accent: string;
  busy: boolean;
  cwd: string;
}

export interface Settings {
  schemeId: string;
  mode: 'dark' | 'light';
  fontSize: number;
  cursorBlink: boolean;
  crtFx: boolean;
  sound: boolean;
  /** 'auto' = each agent uses its preferred provider; otherwise forces provider:model. */
  model: string;
  byokKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  schemeId: DEFAULT_SCHEME_ID,
  mode: 'dark',
  fontSize: 14,
  cursorBlink: true,
  crtFx: false,
  sound: false,
  model: 'auto',
  byokKey: '',
};

export interface Toast { id: number; text: string; }

interface UIState {
  tabs: TabMeta[];
  activeTabId: string;
  settings: Settings;
  settingsOpen: boolean;
  aboutOpen: boolean;
  paletteOpen: boolean;
  confirmCloseOpen: boolean;
  toasts: Toast[];

  addTab(profile: { id: string; label: string; icon: string; accent: string }): string;
  closeTab(id: string): void;
  closeAllTabs(): void;
  activateTab(id: string): void;
  cycleTab(dir: 1 | -1): void;
  renameTab(id: string, title: string): void;
  setLiveTitle(id: string, title: string): void;
  setTabBusy(id: string, busy: boolean): void;
  setTabCwd(id: string, cwd: string): void;

  updateSettings(patch: Partial<Settings>): void;
  setSettingsOpen(v: boolean): void;
  setAboutOpen(v: boolean): void;
  setPaletteOpen(v: boolean): void;
  setConfirmCloseOpen(v: boolean): void;
  toast(text: string): void;
  dismissToast(id: number): void;
}

let tabCounter = 0;
let toastCounter = 0;

function newTabId(): string {
  tabCounter += 1;
  return `tab-${tabCounter}-${Date.now().toString(36)}`;
}

export const useUI = create<UIState>((set, get) => ({
  tabs: [],
  activeTabId: '',
  settings: loadJSON<Settings>('settings', DEFAULT_SETTINGS),
  settingsOpen: false,
  aboutOpen: false,
  paletteOpen: false,
  confirmCloseOpen: false,
  toasts: [],

  addTab(profile) {
    const id = newTabId();
    const tab: TabMeta = {
      id,
      title: profile.label,
      pinnedTitle: false,
      profileId: profile.id,
      icon: profile.icon,
      accent: profile.accent,
      busy: false,
      cwd: 'C:\\Users\\user',
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
    return id;
  },

  closeTab(id) {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) {
      // Closing the last tab = "close window" → confirm dialog handles it.
      set({ confirmCloseOpen: true });
      return;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    const nextActive = activeTabId === id
      ? (next[Math.min(idx, next.length - 1)]?.id ?? next[0]!.id)
      : activeTabId;
    set({ tabs: next, activeTabId: nextActive });
  },

  closeAllTabs() {
    set({ tabs: [], activeTabId: '', confirmCloseOpen: false });
  },

  activateTab(id) {
    if (get().tabs.some((t) => t.id === id)) set({ activeTabId: id });
  },

  cycleTab(dir) {
    const { tabs, activeTabId } = get();
    if (tabs.length < 2) return;
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    const next = tabs[(idx + dir + tabs.length) % tabs.length];
    if (next) set({ activeTabId: next.id });
  },

  renameTab(id, title) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title, pinnedTitle: true } : t)),
    }));
  },

  setLiveTitle(id, title) {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id && !t.pinnedTitle && t.title !== title ? { ...t, title } : t),
    }));
  },

  setTabBusy(id, busy) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id && t.busy !== busy ? { ...t, busy } : t)),
    }));
  },

  setTabCwd(id, cwd) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id && t.cwd !== cwd ? { ...t, cwd } : t)),
    }));
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    saveJSON('settings', settings);
    set({ settings });
  },

  setSettingsOpen(v) { set({ settingsOpen: v }); },
  setAboutOpen(v) { set({ aboutOpen: v }); },
  setPaletteOpen(v) { set({ paletteOpen: v }); },
  setConfirmCloseOpen(v) { set({ confirmCloseOpen: v }); },

  toast(text) {
    toastCounter += 1;
    const id = toastCounter;
    set((s) => ({ toasts: [...s.toasts, { id, text }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
