import React, { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Upload de arquivo com área de arraste; `light` aplica o tema claro do palco de administração
export default function FileField({ value, onChange, accept = "image/*", hint, light = false }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (value && value.type?.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  const clear = (e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.value = ""; onChange(null); };

  const box = light
    ? over ? "border-stage-accent/60 bg-stage-accent-soft/40" : "border-stage-border bg-stage-surface hover:border-stage-accent/40 hover:bg-stage-accent-soft/30"
    : over ? "border-primary/70 bg-primary/[0.08]" : "border-white/[0.14] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]";
  const iconBg = light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.075] text-white/58";
  const nameCls = light ? "text-stage-ink" : "text-white/85";
  const metaCls = light ? "text-stage-muted" : "text-white/35";
  const promptCls = light ? "text-stage-muted" : "text-white/70";
  const clearCls = light ? "text-stage-muted hover:bg-stage-surface hover:text-stage-ink" : "text-white/40 hover:bg-white/[0.07] hover:text-white";

  return (
    <div
      onClick={() => !value && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onChange(f); }}
      className={cn("flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3.5 py-3.5 transition-colors", box)}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {value ? (
        <>
          {preview ? (
            <img src={preview} alt="" className="h-10 w-10 shrink-0 rounded-md border border-white/[0.08] object-cover" />
          ) : (
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", iconBg)}><Upload size={15} /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("break-all text-sm leading-5", nameCls)}>{value.name}</p>
            <p className={cn("text-2xs", metaCls)}>{formatSize(value.size)}</p>
          </div>
          <button type="button" onClick={clear} aria-label="Remover arquivo" className={cn("shrink-0 rounded-full p-1.5 transition-colors", clearCls)}><X size={14} /></button>
        </>
      ) : (
        <>
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.075] text-white/48")}><Upload size={15} /></span>
          <div className="min-w-0">
            <p className={cn("break-words text-sm", promptCls)}>Clique para selecionar ou arraste</p>
            {hint && <p className={cn("break-words text-2xs", metaCls)}>{hint}</p>}
          </div>
        </>
      )}
    </div>
  );
}
