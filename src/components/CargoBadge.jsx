import React from "react";

const PALETTE = ["#c20000", "#d97706", "#0891b2", "#7c3aed", "#db2777", "#16a34a", "#ca8a04", "#0ea5e9", "#9333ea", "#dc2626"];

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
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${small ? "px-1.5 py-0 text-2xs" : "px-2 py-0.5 text-2xs"} ${className}`}
      style={{ color: color || "#fff", backgroundColor: (color || "#888") + "1f", border: `1px solid ${(color || "#888")}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color || "#888" }} />
      {label}
    </span>
  );
}