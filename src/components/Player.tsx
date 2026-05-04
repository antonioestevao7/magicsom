import { useEffect, useRef, useState } from "react";
import { Track } from "@/types/track";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerProps {
  track: Track | null;
  queue: Track[];
  onSelect: (t: Track) => void;
}

export const Player = ({ track, queue, onSelect }: PlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  // Init player
  useEffect(() => {
    if (!ready || !containerRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "0",
      width: "0",
      playerVars: { autoplay: 0, controls: 0 },
      events: {
        onStateChange: (e: any) => {
          setPlaying(e.data === window.YT.PlayerState.PLAYING);
          if (e.data === window.YT.PlayerState.ENDED) playNext();
        },
        onReady: () => {
          playerRef.current.setVolume(volume);
        },
      },
    });
  }, [ready]);

  // Load video when track changes
  useEffect(() => {
    if (!playerRef.current || !track || !playerRef.current.loadVideoById) return;
    playerRef.current.loadVideoById(track.id);
  }, [track]);

  // Poll progress
  useEffect(() => {
    const i = setInterval(() => {
      const p = playerRef.current;
      if (p && p.getCurrentTime) {
        setProgress(p.getCurrentTime() || 0);
        setDuration(p.getDuration() || 0);
      }
    }, 500);
    return () => clearInterval(i);
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const playNext = () => {
    if (!track) return;
    const idx = queue.findIndex((t) => t.id === track.id);
    if (idx >= 0 && idx < queue.length - 1) onSelect(queue[idx + 1]);
  };
  const playPrev = () => {
    if (!track) return;
    const idx = queue.findIndex((t) => t.id === track.id);
    if (idx > 0) onSelect(queue[idx - 1]);
  };

  const onSeek = (val: number[]) => {
    playerRef.current?.seekTo(val[0], true);
    setProgress(val[0]);
  };
  const onVolume = (val: number[]) => {
    setVolume(val[0]);
    setMuted(false);
    playerRef.current?.setVolume(val[0]);
    playerRef.current?.unMute?.();
  };
  const toggleMute = () => {
    if (muted) {
      playerRef.current?.unMute();
      setMuted(false);
    } else {
      playerRef.current?.mute();
      setMuted(true);
    }
  };

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
          {/* Track info */}
          <div className="flex min-w-0 flex-1 items-center gap-3 md:w-1/4 md:flex-none">
            {track ? (
              <>
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg shadow-glow">
                  <img src={track.thumbnail} alt={track.title} className={`h-full w-full object-cover ${playing ? "spin-slow" : ""}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.channel}</p>
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

          {/* Controls */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button onClick={playPrev} className="text-muted-foreground transition hover:text-foreground" aria-label="Anterior">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!track}
                className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow transition hover:scale-105 disabled:opacity-40"
                aria-label={playing ? "Pausar" : "Tocar"}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <button onClick={playNext} className="text-muted-foreground transition hover:text-foreground" aria-label="Próxima">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden w-full max-w-md items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="w-10 text-right tabular-nums">{fmt(progress)}</span>
              <Slider value={[progress]} max={duration || 100} step={1} onValueChange={onSeek} className="flex-1" />
              <span className="w-10 tabular-nums">{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden w-1/4 items-center justify-end gap-2 md:flex">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <Slider value={[muted ? 0 : volume]} max={100} step={1} onValueChange={onVolume} className="w-28" />
          </div>
        </div>
      </div>
    </>
  );
};
