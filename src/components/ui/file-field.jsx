import React, { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useField } from "./field-context";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Upload de arquivo com área de arraste; `light` aplica o tema claro do palco de administração
export default function FileField({ value, onChange, accept = "image/*", hint = "", light = false, existingUrl = "", existingLabel = "Imagem atual", onRemoveExisting = undefined, removeLabel = "Remover imagem", disabled = false, appearance = "default" }) {
  const field = useField();
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

  const isDisabled = () => disabled || inputRef.current?.matches(":disabled");
  const clear = (e) => {
    e.stopPropagation();
    if (isDisabled()) return;
    if (inputRef.current) inputRef.current.value = "";
    if (value) onChange(null);
    else onRemoveExisting?.();
  };
  const attached = value || existingUrl;

  const box = over ? "border-primary/60 bg-primary/[0.06]" : "border-white/[0.12] bg-white/[0.02] hover:border-white/25";
  const iconBg = light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.075] text-white/58";
  const nameCls = light ? "text-stage-ink" : "text-white/85";
  const metaCls = light ? "text-stage-muted" : "text-white/55";
  const promptCls = light ? "text-stage-muted" : "text-white/70";
  const clearCls = light ? "text-stage-muted hover:bg-stage-surface hover:text-stage-ink" : "text-muted-foreground hover:bg-white/[0.07] hover:text-white";

  return (
    <div
      data-appearance={appearance}
      data-attached={attached ? "true" : "false"}
      onDragOver={(e) => { e.preventDefault(); if (!isDisabled()) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f && !isDisabled()) onChange(f); }}
      className={cn("dz-file-field relative flex w-full min-w-0 items-center gap-1 rounded-lg border px-2 py-2 transition-colors focus-within:border-white/35", !attached && "border-dashed", disabled && "opacity-50", box)}
    >
      <input ref={inputRef} type="file" accept={accept} disabled={disabled} className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <button id={field?.id} type="button" disabled={disabled} aria-labelledby={field?.labelId} aria-label={field ? undefined : attached ? "Substituir arquivo" : "Selecionar arquivo"} onClick={() => { if (!isDisabled()) inputRef.current?.click(); }} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed">
      {attached ? (
        <>
          {preview || (!value && existingUrl) ? (
            <img src={preview || existingUrl} alt="" className="h-12 w-12 shrink-0 rounded-md border border-white/[0.08] object-cover" />
          ) : (
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", iconBg)}><Upload size={15} /></span>
          )}
          <span className="min-w-0 flex-1">
            <span title={value ? value.name : existingLabel} className={cn("block truncate text-xs font-medium leading-5", nameCls)}>{value ? value.name : existingLabel}</span>
            <span className={cn("mt-0.5 block text-2xs", metaCls)}>{value ? `${formatSize(value.size)} · Substituir arquivo` : "Substituir imagem"}</span>
          </span>
        </>
      ) : (
        <>
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", light ? "bg-stage-accent-soft text-stage-accent" : "bg-white/[0.075] text-muted-foreground")}><Upload size={15} /></span>
          <span className="min-w-0">
            <span className={cn("block text-xs font-medium", promptCls)}>{accept.startsWith("image/") ? "Selecionar imagem" : accept.startsWith("audio/") ? "Selecionar áudio" : "Selecionar arquivo"}</span>
            <span className={cn("mt-1 block break-words text-2xs", metaCls)}>{hint || "Ou arraste o arquivo até aqui"}</span>
          </span>
        </>
      )}
      </button>
      {attached && (value || onRemoveExisting) && <button type="button" disabled={disabled} onClick={clear} aria-label={value ? "Remover arquivo" : removeLabel} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md transition-colors disabled:cursor-not-allowed", clearCls)}><X size={16} /></button>}
    </div>
  );
}
