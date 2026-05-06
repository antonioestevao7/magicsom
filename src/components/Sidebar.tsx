import { Search, Heart, History, ListMusic, Music2 } from "lucide-react";
import { favoritesStore } from "@/lib/favorites";
import { historyStore } from "@/lib/history";
import { useExternalStore, usePlayerState } from "@/lib/state";

export type View = "search" | "favorites" | "history" | "queue";

interface Props {
  view: View;
  onChange: (v: View) => void;
}

const items: { id: View; label: string; icon: any }[] = [
  { id: "search", label: "Buscar", icon: Search },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "history", label: "Histórico", icon: History },
  { id: "queue", label: "Fila", icon: ListMusic },
];

export const Sidebar = ({ view, onChange }: Props) => {
  const favs = useExternalStore(favoritesStore.subscribe, favoritesStore.get);
  const hist = useExternalStore(historyStore.subscribe, historyStore.get);
  const { queue } = usePlayerState();

  const counts: Record<View, number> = {
    search: 0,
    favorites: favs.length,
    history: hist.length,
    queue: queue.length,
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 border-r border-border/50 bg-card/40 backdrop-blur-xl md:block">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <Music2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Music Sound<span className="text-gradient">.</span>
          </h1>
          <p className="text-[10px] text-muted-foreground">Player com IA</p>
        </div>
      </div>
      <nav className="px-3">
        {items.map((it) => {
          const Active = view === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={`mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                Active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {it.label}
              </span>
              {counts[it.id] > 0 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {counts[it.id]}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export const MobileNav = ({ view, onChange }: Props) => {
  const favs = useExternalStore(favoritesStore.subscribe, favoritesStore.get);
  const hist = useExternalStore(historyStore.subscribe, historyStore.get);
  const { queue } = usePlayerState();
  const counts: Record<View, number> = {
    search: 0,
    favorites: favs.length,
    history: hist.length,
    queue: queue.length,
  };
  return (
    <nav className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-border/50 bg-card/80 px-2 py-2 backdrop-blur-xl md:hidden">
      {items.map((it) => {
        const Active = view === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${
              Active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {it.label}
            {counts[it.id] > 0 && <span className="opacity-70">({counts[it.id]})</span>}
          </button>
        );
      })}
    </nav>
  );
};
