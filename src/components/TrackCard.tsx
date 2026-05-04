import { Track } from "@/types/track";
import { Play, Eye, Clock } from "lucide-react";

interface Props {
  track: Track;
  isActive?: boolean;
  onPlay: () => void;
}

export const TrackCard = ({ track, isActive, onPlay }: Props) => {
  return (
    <button
      onClick={onPlay}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl gradient-card p-3 text-left shadow-card transition hover:scale-[1.02] hover:shadow-glow ${
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
        <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary shadow-glow">
            <Play className="ml-0.5 h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        {track.duration && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            {track.duration}
          </span>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold">{track.title}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{track.channel}</p>
      {track.views && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> {track.views}
        </p>
      )}
    </button>
  );
};
