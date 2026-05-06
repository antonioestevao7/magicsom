import { Track } from "@/types/track";
import { storage, KEYS } from "./storage";

type Listener = () => void;
const listeners = new Set<Listener>();
let favorites: Track[] = storage.get<Track[]>(KEYS.favorites, []);

function persist() {
  storage.set(KEYS.favorites, favorites);
  listeners.forEach((l) => l());
}

export const favoritesStore = {
  get: () => favorites,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  isFavorite(id: string) {
    return favorites.some((t) => t.id === id);
  },
  toggle(track: Track) {
    if (this.isFavorite(track.id)) {
      favorites = favorites.filter((t) => t.id !== track.id);
    } else {
      favorites = [track, ...favorites];
    }
    persist();
  },
  remove(id: string) {
    favorites = favorites.filter((t) => t.id !== id);
    persist();
  },
  clear() {
    favorites = [];
    persist();
  },
};
