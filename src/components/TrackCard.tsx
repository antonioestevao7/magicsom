import { Track } from "@/types/track";
import { Play, Eye, Heart, ListPlus, Plus, X } from "lucide-react";
import { favoritesStore } from "@/lib/favorites";
import { playerStore } from "@/lib/state";
import { useExternalStore } from "@/lib/state";
import { toast } from "sonner";

interface Props {
  track: Track;
  isActive?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

export const TrackCard = ({ track, isActive, onPlay, onRemove, removeLabel }: Props) => {
  const favs = useExternalStore(favoritesStore.subscribe, favoritesStore.get);
  const isFav = favs.some((f) => f.id === track.id);

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      onClick={onPlay}
      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl gradient-card p-3 text-left shadow-card transition hover:scale-[1.02] hover:shadow-glow ${
        isActive ? "ring-2 ring-primary" : "ring-1 ring-border"
      }`}
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">
        <img
          src={track.thumbnail}
          alt={track.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={(e) => { stop(e); playerStore.playNext(track); toast.success("Tocará a seguir"); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-primary"
              aria-label="Tocar a seguir"
              title="Tocar a seguir"
            >
              <ListPlus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { stop(e); playerStore.enqueue(track); toast.success("Adicionado à fila"); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-primary"
              aria-label="Adicionar à fila"
              title="Adicionar à fila"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary shadow-glow">
            <Play className="ml-0.5 h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        {track.duration && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            {track.duration}
          </span>
        )}
        <button
          onClick={(e) => { stop(e); favoritesStore.toggle(track); }}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition active:scale-90 ${
            isFav ? "bg-primary/90 text-primary-foreground" : "bg-black/60 text-white hover:bg-black/80"
          }`}
          aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>
        {onRemove && (
          <button
            onClick={(e) => { stop(e); onRemove(); }}
            className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground opacity-0 backdrop-blur transition hover:bg-destructive group-hover:opacity-100"
            aria-label={removeLabel ?? "Remover"}
            title={removeLabel ?? "Remover"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold">{track.title}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{track.channel}</p>
      {track.views && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> {track.views}
        </p>
      )}
    </div>
  );
};
