import { Track } from "@/types/track";
import { storage, KEYS } from "./storage";

const MAX = 50;
type Listener = () => void;
const listeners = new Set<Listener>();
let history: Track[] = storage.get<Track[]>(KEYS.history, []);

function persist() {
  storage.set(KEYS.history, history);
  listeners.forEach((l) => l());
}

export const historyStore = {
  get: () => history,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(track: Track) {
    // Evita duplicação consecutiva
    if (history[0]?.id === track.id) return;
    history = [track, ...history.filter((t) => t.id !== track.id)].slice(0, MAX);
    persist();
  },
  remove(id: string) {
    history = history.filter((t) => t.id !== id);
    persist();
  },
  clear() {
    history = [];
    persist();
  },
};
