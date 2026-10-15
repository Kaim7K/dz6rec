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
    <section className="dz-card min-w-0 p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04] text-primary">
            <Music2 size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">Faixas</h3>
            <p className="text-sm text-muted-foreground">{list.length} {list.length === 1 ? "faixa" : "faixas"} neste projeto</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="dz-ghost-button h-9"><Plus size={15} />Adicionar faixa</button>
      </div>
      {list.length === 0 ? (
        <div className="dz-empty min-h-36">Nenhuma faixa ainda. Adicione a primeira.</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-0 rounded-lg border border-white/[0.07] bg-black/15">
                <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_4rem_8rem_minmax(7rem,10rem)_2.5rem] border-b border-white/[0.065] bg-white/[0.025] px-4 py-3 text-2xs font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:grid">
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
