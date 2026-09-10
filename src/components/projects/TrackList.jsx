import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Music2, Plus } from "lucide-react";
import { apiClient } from "@/api/appClient";
import { logActivity } from "@/lib/music";
import TrackRow from "@/components/projects/TrackRow";
import AddTrackDialog from "@/components/projects/AddTrackDialog";

export default function TrackList({ project, tracks, onChanged, progressPct = 0 }) {
  const [open, setOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(() => tracks.map((t) => t.id));
  useEffect(() => { setLocalOrder(tracks.map((t) => t.id)); }, [tracks]);
  const list = localOrder.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);

  const onDragEnd = async (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    const next = Array.from(localOrder);
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    setLocalOrder(next);
    const ordered = next.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    await apiClient.entities.Track.bulkUpdate(ordered.map((t, i) => ({ id: t.id, track_number: i + 1 })));
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, "Faixas reordenadas", me?.full_name);
    onChanged();
  };

  return (
    <section className="rounded-lg border border-white/[0.045] bg-[#090606] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music2 size={25} className="text-white" />
          <div>
            <h3 className="text-base font-bold text-white">Faixas</h3>
            <p className="text-sm text-white/45">{list.length} {list.length === 1 ? "faixa" : "faixas"} neste projeto</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-white/[0.05] px-3 text-sm font-bold text-white/78 transition-colors hover:bg-white/[0.08]"><Plus size={15} />Adicionar faixa</button>
      </div>
      {list.length === 0 ? (
        <p className="border-y border-white/[0.05] py-8 text-center text-sm text-white/40">Nenhuma faixa ainda. Adicione a primeira.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <div className="hidden grid-cols-[3rem_1fr_6rem_9rem_18rem_2rem] border-b border-white/[0.055] px-0 pb-3 text-2xs font-bold uppercase tracking-[0.12em] text-white/42 lg:grid">
                  <span>#</span>
                  <span>Título</span>
                  <span>Duração</span>
                  <span>Status</span>
                  <span>Progresso</span>
                  <span />
                </div>
                {list.map((t, i) => (
                  <Draggable key={t.id} draggableId={t.id} index={i}>
                    {(prov) => <TrackRow track={t} project={project} queue={list} index={i} provided={prov} progressPct={progressPct} />}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <AddTrackDialog open={open} onClose={() => setOpen(false)} onCreated={onChanged} project={project} trackCount={list.length} />
    </section>
  );
}
