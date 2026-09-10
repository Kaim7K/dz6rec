import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";

export default function HistoryTab({ project }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => { apiClient.entities.ActivityLog.filter({ project_id: project.id }).then((l) => setLogs(l.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)))); }, [project.id]);
  if (!logs.length) return <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center text-sm text-white/35">Sem histórico ainda.</div>;
  return (
    <div className="space-y-2">{logs.map((l) => (
      <div key={l.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-sm">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/50" />
        <div><p className="text-white/85">{l.text}</p><p className="mt-0.5 text-2xs text-white/35">{l.user_name} · {new Date(l.created_date).toLocaleString("pt-BR")}</p></div>
      </div>
    ))}</div>
  );
}
