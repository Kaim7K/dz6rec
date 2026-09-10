import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { logActivity } from "@/lib/music";
import TrackRow from "@/components/projects/TrackRow";
import AddTrackDialog from "@/components/projects/AddTrackDialog";

export default function TrackList({ project, tracks, onChanged }) {
  const [open, setOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(() => tracks.map((t) => t.id));
  useEffect(() => { setLocalOrder(tracks.map((t) => t.id)); }, [tracks]);
  const list = localOrder.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
  const isSingle = project?.type === "single";
  const canAdd = !isSingle || list.length === 0;

  const onDragEnd = async (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    const next = Array.from(localOrder);
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    setLocalOrder(next);
    const ordered = next.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    await base44.entities.Track.bulkUpdate(ordered.map((t, i) => ({ id: t.id, track_number: i + 1 })));
    const me = await base44.auth.me().catch(() => null);
    await logActivity(project.id, "Faixas reordenadas", me?.full_name);
    onChanged();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-medium text-white">Faixas</h3>
          <span className="text-2xs text-white/35">{list.length} {isSingle ? "· Single" : ""}</span>
        </div>
        {canAdd ? (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"><Plus size={16} />Adicionar faixa</button>
        ) : (
          <span className="text-2xs text-white/30">Singles aceitam apenas uma faixa</span>
        )}
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-sm text-white/40">Nenhuma faixa ainda. Adicione a primeira.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                {list.map((t, i) => (
                  <Draggable key={t.id} draggableId={t.id} index={i}>
                    {(prov) => <TrackRow track={t} project={project} queue={list} index={i} provided={prov} />}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <AddTrackDialog open={open} onClose={() => setOpen(false)} onCreated={onChanged} project={project} trackCount={list.length} />
    </div>
  );
}