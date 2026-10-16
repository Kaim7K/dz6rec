import React from "react";
import { cn } from "@/lib/utils";

const PALETTE = ["#fca5a5", "#f87171", "#fecaca", "#e5e7eb", "#fca5a5", "#f5f5f5", "#d4d4d4", "#a3a3a3"];

const initialsOf = (name) =>
  (name || "U").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const colorOf = (name) =>
  PALETTE[(name || "").split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) % PALETTE.length];

export default function ChatAvatar({ name, photoUrl = "", size = 32, className = "" }) {
  const color = colorOf(name);
  return (
    <span
      className={cn("grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-semibold", className)}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36), background: `${color}2e`, color }}
    >
      {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : initialsOf(name)}
    </span>
  );
}
