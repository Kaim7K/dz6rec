import React from "react";
import { STATUS, STATUS_TONE } from "@/lib/music";

export default function StatusBadge({ status, className = "" }) {
  const t = STATUS_TONE[status] || STATUS_TONE.ideia;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium ${t.bg} ${t.text} ${t.border} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {STATUS[status]}
    </span>
  );
}