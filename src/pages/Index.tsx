import { useState, FormEvent, useRef } from "react";
import { Search, Sparkles, Loader2, Music2 } from "lucide-react";
import { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";
import { Player } from "@/components/Player";
import { toast } from "sonner";
import { searchMusic, optimizeQuery } from "@/lib/search";
import { playerStore, usePlayerState } from "@/lib/state";

const SUGGESTIONS = [
  "Músicas tristes dos anos 80",
  "Lo-fi para estudar",
  "Top hits brasileiros 2024",
  "Rock clássico inesquecível",
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [smartQuery, setSmartQuery] = useState("");
  const { currentTrack } = usePlayerState();
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
      playerStore.setQueue(results);
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

  return (
    <div className="min-h-screen pb-32">
      <header className="border-b border-border/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 md:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Music2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Music Sound<span className="text-gradient">.</span>
            </h1>
            <p className="text-xs text-muted-foreground">Player musical com busca inteligente</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
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

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-semibold">Resultados</h3>
            <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${loading ? "pointer-events-none opacity-60" : ""}`}>
              {results.map((t) => (
                <TrackCard
                  key={t.id}
                  track={t}
                  isActive={currentTrack?.id === t.id}
                  onPlay={() => playerStore.play(t)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Player />
    </div>
  );
};

export default Index;
