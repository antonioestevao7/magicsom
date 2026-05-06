import { useEffect, useRef, useSyncExternalStore } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ytPlayer } from "@/lib/player";
import { playerStore, usePlayerState } from "@/lib/state";

export const Player = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTrack } = usePlayerState();
  const p = useSyncExternalStore(
    ytPlayer.subscribe.bind(ytPlayer),
    () => ytPlayer.state,
    () => ytPlayer.state
  );

  // Init player once
  useEffect(() => {
    if (!containerRef.current) return;
    ytPlayer.init(containerRef.current, () => playerStore.next());
  }, []);

  // Load track when current changes (com retomada de sessão se for a mesma)
  useEffect(() => {
    if (!currentTrack) return;
    const snap = ytPlayer.getSavedSnapshot();
    const resume = snap && snap.videoId === currentTrack.id ? snap.time : 0;
    ytPlayer.load(currentTrack.id, resume);
  }, [currentTrack]);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <>
      <div ref={containerRef} className="hidden" />
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl shadow-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-6 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:w-1/4 md:flex-none">
            {currentTrack ? (
              <>
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg shadow-glow">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className={`h-full w-full object-cover ${p.playing ? "spin-slow" : ""}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentTrack.channel}</p>
                  {p.error && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" /> {p.error}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary">
                  <Music2 className="h-6 w-6" />
                </div>
                <p className="text-sm">Selecione uma música</p>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button onClick={() => playerStore.prev()} className="text-muted-foreground transition hover:text-foreground" aria-label="Anterior">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={() => ytPlayer.togglePlay()}
                disabled={!currentTrack || !p.ready}
                className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow transition hover:scale-105 disabled:opacity-40"
                aria-label={p.playing ? "Pausar" : "Tocar"}
              >
                {p.playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <button onClick={() => playerStore.next()} className="text-muted-foreground transition hover:text-foreground" aria-label="Próxima">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden w-full max-w-md items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="w-10 text-right tabular-nums">{fmt(p.progress)}</span>
              <Slider value={[p.progress]} max={p.duration || 100} step={1} onValueChange={(v) => ytPlayer.seek(v[0])} className="flex-1" />
              <span className="w-10 tabular-nums">{fmt(p.duration)}</span>
            </div>
          </div>

          <div className="hidden w-1/4 items-center justify-end gap-2 md:flex">
            <button onClick={() => ytPlayer.toggleMute()} className="text-muted-foreground hover:text-foreground" aria-label="Mute">
              {p.muted || p.volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <Slider value={[p.muted ? 0 : p.volume]} max={100} step={1} onValueChange={(v) => ytPlayer.setVolume(v[0])} className="w-28" />
          </div>
        </div>
      </div>
    </>
  );
};
