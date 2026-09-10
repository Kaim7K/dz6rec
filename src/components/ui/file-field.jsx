import React, { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Upload de arquivo com Ã¡rea de arraste; `light` aplica o tema claro do palco de administraÃ§Ã£o
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
    : over ? "border-primary/70 bg-primary/[0.07]" : "border-white/[0.14] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]";
  const iconBg = light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.06] text-white/55";
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
      className={cn("flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-3 transition-colors", box)}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {value ? (
        <>
          {preview ? (
            <img src={preview} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          ) : (
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", iconBg)}><Upload size={15} /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm", nameCls)}>{value.name}</p>
            <p className={cn("text-2xs", metaCls)}>{formatSize(value.size)}</p>
          </div>
          <button type="button" onClick={clear} aria-label="Remover arquivo" className={cn("rounded-full p-1.5 transition-colors", clearCls)}><X size={14} /></button>
        </>
      ) : (
        <>
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.05] text-white/45")}><Upload size={15} /></span>
          <div>
            <p className={cn("text-sm", promptCls)}>Clique para selecionar ou arraste</p>
            {hint && <p className={cn("text-2xs", metaCls)}>{hint}</p>}
          </div>
        </>
      )}
    </div>
  );
}