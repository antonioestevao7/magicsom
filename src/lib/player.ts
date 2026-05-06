// Global YouTube IFrame Player controller (singleton)
// Loads the API once, exposes a stable controller that survives re-renders.
import { storage, KEYS } from "./storage";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Listener = () => void;

interface SessionSnapshot {
  videoId: string | null;
  time: number;
  playing: boolean;
}

class YouTubePlayerController {
  private player: any = null;
  private ready = false;
  private apiLoading = false;
  private pendingVideoId: string | null = null;
  private listeners = new Set<Listener>();
  private currentVideoId: string | null = null;

  state = {
    ready: false,
    playing: false,
    progress: 0,
    duration: 0,
    volume: 80,
    muted: false,
    error: null as string | null,
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  /** Carrega API e cria player em um container fixo */
  init(container: HTMLElement, onEnded: () => void) {
    if (this.player) return;
    this.loadApi().then(() => this.createPlayer(container, onEnded));
  }

  private loadApi(): Promise<void> {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();
      if (this.apiLoading) {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
        return;
      }
      this.apiLoading = true;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }

  private createPlayer(container: HTMLElement, onEnded: () => void) {
    if (this.player) return;
    this.player = new window.YT.Player(container, {
      height: "0",
      width: "0",
      playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
      events: {
        onReady: () => {
          this.ready = true;
          this.state.ready = true;
          this.player.setVolume(this.state.volume);
          if (this.pendingVideoId) {
            const id = this.pendingVideoId;
            this.pendingVideoId = null;
            this.load(id);
          }
          this.emit();
        },
        onStateChange: (e: any) => {
          const YT = window.YT;
          this.state.playing = e.data === YT.PlayerState.PLAYING;
          if (e.data === YT.PlayerState.ENDED) onEnded();
          this.emit();
        },
        onError: (e: any) => {
          // 2 invalid id, 5 html5 error, 100 not found, 101/150 embedding disabled
          const map: Record<number, string> = {
            2: "ID inválido",
            5: "Erro no player HTML5",
            100: "Vídeo não encontrado",
            101: "Reprodução bloqueada pelo proprietário",
            150: "Reprodução bloqueada pelo proprietário",
          };
          this.state.error = map[e.data] ?? "Erro ao reproduzir";
          this.state.playing = false;
          this.emit();
        },
      },
    });

    // Poll progress + persist session
    setInterval(() => {
      if (!this.player?.getCurrentTime) return;
      this.state.progress = this.player.getCurrentTime() || 0;
      this.state.duration = this.player.getDuration() || 0;
      this.emit();
      // persiste sessão a cada 2s
      if (this.currentVideoId && this.state.progress > 0) {
        const now = Date.now();
        if (now - this.lastPersist > 2000) {
          this.lastPersist = now;
          storage.set<SessionSnapshot>(`${KEYS.session}.snapshot`, {
            videoId: this.currentVideoId,
            time: this.state.progress,
            playing: this.state.playing,
          });
        }
      }
    }, 500);
  }

  private lastPersist = 0;
  private resumeAt = 0;

  /** Carrega um vídeo. resumeFrom: posição em segundos para retomar (opcional). */
  load(videoId: string, resumeFrom = 0) {
    if (!videoId) return;
    this.state.error = null;
    this.resumeAt = resumeFrom;
    if (!this.ready || !this.player?.loadVideoById) {
      this.pendingVideoId = videoId;
      setTimeout(() => {
        if (this.ready && this.pendingVideoId) {
          const id = this.pendingVideoId;
          this.pendingVideoId = null;
          this.load(id, this.resumeAt);
        }
      }, 500);
      return;
    }
    if (this.currentVideoId === videoId) {
      this.player.playVideo();
      return;
    }
    this.currentVideoId = videoId;
    if (resumeFrom > 0) {
      this.player.loadVideoById({ videoId, startSeconds: resumeFrom });
    } else {
      this.player.loadVideoById(videoId);
    }
    this.emit();
  }

  /** Tenta retomar a última sessão salva (sem autoplay) */
  getSavedSnapshot(): SessionSnapshot | null {
    return storage.get<SessionSnapshot | null>(`${KEYS.session}.snapshot`, null);
  }

  togglePlay() {
    if (!this.ready) return;
    if (this.state.playing) this.player.pauseVideo();
    else this.player.playVideo();
  }
  seek(s: number) {
    if (!this.ready) return;
    this.player.seekTo(s, true);
    this.state.progress = s;
    this.emit();
  }
  setVolume(v: number) {
    this.state.volume = v;
    this.state.muted = false;
    if (this.ready) {
      this.player.setVolume(v);
      this.player.unMute?.();
    }
    this.emit();
  }
  toggleMute() {
    if (!this.ready) return;
    if (this.state.muted) {
      this.player.unMute();
      this.state.muted = false;
    } else {
      this.player.mute();
      this.state.muted = true;
    }
    this.emit();
  }
}

export const ytPlayer = new YouTubePlayerController();
