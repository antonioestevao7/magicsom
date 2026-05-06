import { Track } from "@/types/track";
import { GripVertical, X, Play, ListMusic, Trash2 } from "lucide-react";
import { playerStore, usePlayerState } from "@/lib/state";
import { useState } from "react";

export const QueueView = () => {
  const { queue, currentTrack } = usePlayerState();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (!queue.length && !currentTrack) {
    return (
      <EmptyState
        icon={<ListMusic className="h-10 w-10" />}
        title="Fila vazia"
        text="Adicione músicas à fila a partir da busca."
      />
    );
  }

  return (
    <div className="space-y-6">
      {currentTrack && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Tocando agora</h3>
          <Row track={currentTrack} active />
        </section>
      )}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Próximas ({queue.length})</h3>
          {queue.length > 0 && (
            <button
              onClick={() => playerStore.clearQueue()}
              className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <div className="space-y-1">
          {queue.map((t, i) => (
            <div
              key={t.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== i) playerStore.reorderQueue(dragIdx, i);
                setDragIdx(null);
              }}
            >
              <Row
                track={t}
                onPlay={() => {
                  // tocar essa imediatamente: remove daí, faz play
                  playerStore.removeFromQueue(t.id);
                  playerStore.play(t);
                }}
                onRemove={() => playerStore.removeFromQueue(t.id)}
                draggable
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Row = ({
  track,
  active,
  onPlay,
  onRemove,
  draggable,
}: {
  track: Track;
  active?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  draggable?: boolean;
}) => (
  <div
    className={`group flex items-center gap-3 rounded-lg p-2 transition hover:bg-secondary/60 ${
      active ? "bg-primary/10 ring-1 ring-primary/30" : ""
    }`}
  >
    {draggable && (
      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
    )}
    <img src={track.thumbnail} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
    <div className="min-w-0 flex-1">
      <p className={`truncate text-sm ${active ? "font-semibold text-primary" : "font-medium"}`}>
        {track.title}
      </p>
      <p className="truncate text-xs text-muted-foreground">{track.channel}</p>
    </div>
    {onPlay && (
      <button
        onClick={onPlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary opacity-0 transition hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
        aria-label="Tocar"
      >
        <Play className="ml-0.5 h-4 w-4" />
      </button>
    )}
    {onRemove && (
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        aria-label="Remover"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

export const EmptyState = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
    <div className="mb-3 text-muted-foreground">{icon}</div>
    <h4 className="mb-1 text-base font-semibold">{title}</h4>
    <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
  </div>
);
