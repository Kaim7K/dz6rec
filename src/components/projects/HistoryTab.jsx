import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";

export default function HistoryTab({ project }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => { apiClient.entities.ActivityLog.filter({ project_id: project.id }).then((l) => setLogs(l.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()))); }, [project.id]);
  if (!logs.length) return <div className="dz-empty p-6 text-center text-sm">Sem histórico ainda.</div>;
  return (
    <div className="dz-card min-w-0 px-4 py-1 sm:px-5" role="list" aria-label="Histórico do projeto">{logs.map((l) => (
      <div key={l.id} role="listitem" className="dz-history-entry text-sm">
        <div className="min-w-0 [overflow-wrap:anywhere]"><p className="text-white/85">{l.text}</p><p className="mt-0.5 text-2xs text-muted-foreground">{l.user_name} · {new Date(l.created_date).toLocaleString("pt-BR")}</p></div>
      </div>
    ))}</div>
  );
}
