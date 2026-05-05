// Player & queue state — minimal store + React hook (no external deps)
import { useSyncExternalStore } from "react";
import { Track } from "@/types/track";

interface State {
  currentTrack: Track | null;
  queue: Track[];
}

let state: State = { currentTrack: null, queue: [] };
const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const playerStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setQueue: (q: Track[]) => setState({ queue: q }),
  play: (t: Track) => {
    if (state.currentTrack?.id === t.id) return; // evita recarregar mesma faixa
    setState({ currentTrack: t });
  },
  next: () => {
    const { currentTrack, queue } = state;
    if (!currentTrack) return;
    const i = queue.findIndex((x) => x.id === currentTrack.id);
    if (i >= 0 && i < queue.length - 1) setState({ currentTrack: queue[i + 1] });
  },
  prev: () => {
    const { currentTrack, queue } = state;
    if (!currentTrack) return;
    const i = queue.findIndex((x) => x.id === currentTrack.id);
    if (i > 0) setState({ currentTrack: queue[i - 1] });
  },
};

export function usePlayerState() {
  return useSyncExternalStore(playerStore.subscribe, playerStore.get, playerStore.get);
}
