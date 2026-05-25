import { create } from 'zustand';

interface MirageState {
  version: string;
  _hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useMirageStore = create<MirageState>((set) => ({
  version: '0.1.0',
  _hydrated: false,
  setHydrated: (v) => set({ _hydrated: v }),
}));
