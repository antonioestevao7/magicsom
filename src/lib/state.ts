// Player & queue state via Zustand-free lightweight store using React hooks
import { create } from "zustand";
import { Track } from "@/types/track";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  setQueue: (q: Track[]) => void;
  play: (t: Track) => void;
  next: () => void;
  prev: () => void;
}

export const usePlayerState = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  setQueue: (q) => set({ queue: q }),
  play: (t) => {
    const { currentTrack } = get();
    if (currentTrack?.id === t.id) return; // evita recarregar mesma faixa
    set({ currentTrack: t });
  },
  next: () => {
    const { currentTrack, queue } = get();
    if (!currentTrack) return;
    const i = queue.findIndex((x) => x.id === currentTrack.id);
    if (i >= 0 && i < queue.length - 1) set({ currentTrack: queue[i + 1] });
  },
  prev: () => {
    const { currentTrack, queue } = get();
    if (!currentTrack) return;
    const i = queue.findIndex((x) => x.id === currentTrack.id);
    if (i > 0) set({ currentTrack: queue[i - 1] });
  },
}));
