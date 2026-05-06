// Player & queue state — minimal store + React hook (no external deps)
import { useSyncExternalStore } from "react";
import { Track } from "@/types/track";
import { storage, KEYS } from "./storage";
import { historyStore } from "./history";

interface State {
  currentTrack: Track | null;
  queue: Track[]; // fila de reprodução real (próximas)
  searchResults: Track[]; // contexto da última busca (para next/prev quando sem fila)
}

const initial: State = {
  currentTrack: storage.get<Track | null>(`${KEYS.session}.track`, null),
  queue: storage.get<Track[]>(KEYS.queue, []),
  searchResults: [],
};

let state: State = initial;
const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function persistQueue() {
  storage.set(KEYS.queue, state.queue);
}

function persistTrack() {
  storage.set(`${KEYS.session}.track`, state.currentTrack);
}

export const playerStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  // ---------- contexto de busca ----------
  setSearchResults: (q: Track[]) => setState({ searchResults: q }),

  // ---------- play / next / prev ----------
  play: (t: Track) => {
    if (state.currentTrack?.id === t.id) return;
    setState({ currentTrack: t });
    persistTrack();
    historyStore.add(t);
  },

  next: () => {
    const { currentTrack, queue, searchResults } = state;
    // 1) Se há fila, consome o primeiro
    if (queue.length > 0) {
      const [nextTrack, ...rest] = queue;
      setState({ currentTrack: nextTrack, queue: rest });
      persistQueue();
      persistTrack();
      historyStore.add(nextTrack);
      return;
    }
    // 2) Senão, navega nos resultados de busca
    if (!currentTrack) return;
    const i = searchResults.findIndex((x) => x.id === currentTrack.id);
    if (i >= 0 && i < searchResults.length - 1) {
      const nx = searchResults[i + 1];
      setState({ currentTrack: nx });
      persistTrack();
      historyStore.add(nx);
    }
  },

  prev: () => {
    const { currentTrack, searchResults } = state;
    if (!currentTrack) return;
    const i = searchResults.findIndex((x) => x.id === currentTrack.id);
    if (i > 0) {
      const pv = searchResults[i - 1];
      setState({ currentTrack: pv });
      persistTrack();
      historyStore.add(pv);
    }
  },

  // ---------- fila ----------
  enqueue: (t: Track) => {
    if (state.queue.some((x) => x.id === t.id)) return;
    setState({ queue: [...state.queue, t] });
    persistQueue();
  },
  playNext: (t: Track) => {
    const filtered = state.queue.filter((x) => x.id !== t.id);
    setState({ queue: [t, ...filtered] });
    persistQueue();
  },
  removeFromQueue: (id: string) => {
    setState({ queue: state.queue.filter((x) => x.id !== id) });
    persistQueue();
  },
  reorderQueue: (from: number, to: number) => {
    const q = [...state.queue];
    const [it] = q.splice(from, 1);
    q.splice(to, 0, it);
    setState({ queue: q });
    persistQueue();
  },
  clearQueue: () => {
    setState({ queue: [] });
    persistQueue();
  },
};

export function usePlayerState() {
  return useSyncExternalStore(playerStore.subscribe, playerStore.get, playerStore.get);
}

// hook utilitário p/ stores externos (favorites/history)
export function useExternalStore<T>(
  subscribe: (l: () => void) => () => void,
  getSnapshot: () => T,
) {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
