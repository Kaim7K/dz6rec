import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import ArtifactReviewDialog from "./ArtifactReviewDialog";
import { toast } from "@/components/ui/use-toast";

export default function LinkedReview({ entity, recordId, project, defaultReviewerId, onClose, onSaved }) {
  const [artifact, setArtifact] = useState(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!["TrackVersion", "ProjectFile"].includes(entity)) throw new Error("Tipo de arquivo inválido.");
        const record = await apiClient.entities[entity].get(recordId);
        const projectId = entity === "TrackVersion" ? (await apiClient.entities.Track.get(record.track_id)).project_id : record.project_id;
        if (projectId !== project.id) throw new Error("Este arquivo pertence a outro projeto.");
        if (active) setArtifact(record);
      } catch (err) { if (active) { toast({ variant: "destructive", title: "Não foi possível abrir a revisão", description: err.message }); onClose(); } }
    };
    load();
    return () => { active = false; };
  }, [entity, recordId, project.id]);
  return artifact && <ArtifactReviewDialog entity={entity} artifact={artifact} project={project} defaultReviewerId={defaultReviewerId} onClose={onClose} onSaved={onSaved} />;
}
