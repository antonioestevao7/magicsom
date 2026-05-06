// Safe localStorage wrapper with JSON + error handling
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("storage.set failed", key, e);
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

export const KEYS = {
  favorites: "ms.favorites.v1",
  history: "ms.history.v1",
  queue: "ms.queue.v1",
  session: "ms.session.v1",
} as const;
