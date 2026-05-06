import { useState, FormEvent, useRef } from "react";
import { Search, Sparkles, Loader2, Heart, History as HistoryIcon, Trash2, Clock } from "lucide-react";
import { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";
import { Player } from "@/components/Player";
import { Sidebar, MobileNav, View } from "@/components/Sidebar";
import { QueueView, EmptyState } from "@/components/QueueView";
import { toast } from "sonner";
import { searchMusic, optimizeQuery } from "@/lib/search";
import { playerStore, usePlayerState, useExternalStore } from "@/lib/state";
import { favoritesStore } from "@/lib/favorites";
import { historyStore } from "@/lib/history";

const SUGGESTIONS = [
  "Músicas tristes dos anos 80",
  "Lo-fi para estudar",
  "Top hits brasileiros 2024",
  "Rock clássico inesquecível",
];

const Index = () => {
  const [view, setView] = useState<View>("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [smartQuery, setSmartQuery] = useState("");
  const { currentTrack } = usePlayerState();
  const favorites = useExternalStore(favoritesStore.subscribe, favoritesStore.get);
  const history = useExternalStore(historyStore.subscribe, historyStore.get);
  const lastQueryRef = useRef("");

  const runSearch = async (q: string) => {
    const opt = optimizeQuery(q);
    if (!opt || opt === lastQueryRef.current) return;
    lastQueryRef.current = opt;
    setLoading(true);
    try {
      const { results, smartQuery } = await searchMusic(q);
      setResults(results);
      setSmartQuery(smartQuery);
      playerStore.setSearchResults(results);
      if (!results.length) toast.info("Nenhum resultado encontrado");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao buscar");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    runSearch(query);
  };

  const onSuggest = (s: string) => {
    if (loading) return;
    setQuery(s);
    runSearch(s);
  };

  const playList = (list: Track[], track: Track) => {
    playerStore.setSearchResults(list);
    playerStore.play(track);
  };

  return (
    <div className="flex min-h-screen pb-32">
      <Sidebar view={view} onChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav view={view} onChange={setView} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-12">
          {view === "search" && (
            <>
              <section className="mb-10 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> Busca com IA
                </div>
                <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
                  Encontre <span className="text-gradient">qualquer música</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-sm text-muted-foreground md:text-base">
                  Descreva o que você quer ouvir — humor, gênero, época, artista — e a IA encontra para você.
                </p>

                <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ex: músicas relaxantes para dormir..."
                      disabled={loading}
                      className="h-14 w-full rounded-full border border-border bg-card pl-12 pr-4 text-sm shadow-card outline-none transition focus:border-primary focus:shadow-glow disabled:opacity-70"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 items-center gap-2 rounded-full gradient-primary px-6 font-semibold text-primary-foreground shadow-glow transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    <span className="hidden md:inline">Buscar</span>
                  </button>
                </form>

                {!results.length && !loading && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => onSuggest(s)}
                        disabled={loading}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {smartQuery && smartQuery.toLowerCase() !== query.toLowerCase() && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                    IA buscou: <span className="text-foreground">{smartQuery}</span>
                  </p>
                )}
              </section>

              {/* Ouvido recentemente */}
              {!results.length && !loading && history.length > 0 && (
                <section className="mb-10">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-4 w-4 text-primary" /> Ouvido recentemente
                  </h3>
                  <Grid
                    tracks={history.slice(0, 10)}
                    currentId={currentTrack?.id}
                    onPlay={(t) => playList(history.slice(0, 10), t)}
                  />
                </section>
              )}

              {loading && <SkeletonGrid />}

              {!loading && results.length > 0 && (
                <section>
                  <h3 className="mb-4 text-lg font-semibold">Resultados</h3>
                  <Grid
                    tracks={results}
                    currentId={currentTrack?.id}
                    onPlay={(t) => playList(results, t)}
                  />
                </section>
              )}
            </>
          )}

          {view === "favorites" && (
            <Section
              title="Favoritos"
              icon={<Heart className="h-5 w-5 text-primary" />}
              count={favorites.length}
            >
              {favorites.length ? (
                <Grid
                  tracks={favorites}
                  currentId={currentTrack?.id}
                  onPlay={(t) => playList(favorites, t)}
                  onRemove={(t) => favoritesStore.remove(t.id)}
                  removeLabel="Remover dos favoritos"
                />
              ) : (
                <EmptyState
                  icon={<Heart className="h-10 w-10" />}
                  title="Sem favoritos"
                  text="Toque no coração de uma música para guardá-la aqui."
                />
              )}
            </Section>
          )}

          {view === "history" && (
            <Section
              title="Histórico"
              icon={<HistoryIcon className="h-5 w-5 text-primary" />}
              count={history.length}
              action={
                history.length ? (
                  <button
                    onClick={() => { historyStore.clear(); toast.success("Histórico limpo"); }}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Limpar
                  </button>
                ) : null
              }
            >
              {history.length ? (
                <Grid
                  tracks={history}
                  currentId={currentTrack?.id}
                  onPlay={(t) => playList(history, t)}
                  onRemove={(t) => historyStore.remove(t.id)}
                  removeLabel="Remover do histórico"
                />
              ) : (
                <EmptyState
                  icon={<HistoryIcon className="h-10 w-10" />}
                  title="Sem histórico"
                  text="As músicas que você tocar aparecerão aqui."
                />
              )}
            </Section>
          )}

          {view === "queue" && (
            <Section title="Fila de reprodução">
              <QueueView />
            </Section>
          )}
        </main>
      </div>

      <Player />
    </div>
  );
};

const Section = ({
  title,
  icon,
  count,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <div className="mb-6 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
          {icon} {title}
          {typeof count === "number" && (
            <span className="text-base font-normal text-muted-foreground">({count})</span>
          )}
        </h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Grid = ({
  tracks,
  currentId,
  onPlay,
  onRemove,
  removeLabel,
}: {
  tracks: Track[];
  currentId?: string;
  onPlay: (t: Track) => void;
  onRemove?: (t: Track) => void;
  removeLabel?: string;
}) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {tracks.map((t) => (
      <TrackCard
        key={t.id}
        track={t}
        isActive={currentId === t.id}
        onPlay={() => onPlay(t)}
        onRemove={onRemove ? () => onRemove(t) : undefined}
        removeLabel={removeLabel}
      />
    ))}
  </div>
);

const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
    ))}
  </div>
);

export default Index;
