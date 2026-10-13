import React from "react";

const PALETTE = ["#dc0000", "#b91c1c", "#991b1b", "#7f1d1d", "#ef4444", "#d97706", "#a3a3a3", "#737373", "#525252", "#f5f5f5"];

export function cargoColor(name, cargos) {
  if (!name) return null;
  const key = Array.isArray(name) ? name[0] : name;
  if (typeof key !== "string") return null;
  const c = cargos?.find((x) => x.name === key);
  if (c?.color) return c.color;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function CargoBadge({ cargo, cargos, className = "", small = false }) {
  if (!cargo) return null;
  const label = Array.isArray(cargo) ? cargo.filter(Boolean).join(", ") : cargo;
  if (!label) return null;
  const color = cargoColor(cargo, cargos);
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-full font-medium ${small ? "px-1.5 py-0 text-2xs" : "px-2 py-0.5 text-2xs"} ${className}`}
      style={{ color: color || "#fff", backgroundColor: (color || "#888") + "1f", border: `1px solid ${(color || "#888")}40` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color || "#888" }} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
