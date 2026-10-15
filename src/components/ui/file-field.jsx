import React, { useEffect, useRef, useState } from "react";
import { FileAudio, FileText, ImagePlus, Replace, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useField } from "@/components/ui/field-context";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileField({ value, onChange, accept = "image/*", hint, light = false, disabled = false }) {
  const field = useField();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const isDisabled = () => disabled || inputRef.current?.matches(":disabled");

  useEffect(() => {
    if (value && value.type?.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  const choose = () => {
    if (isDisabled()) return;
    // Allow selecting the same file again after a failed attempt.
    inputRef.current.value = "";
    inputRef.current.click();
  };
  const clear = () => {
    if (isDisabled()) return;
    inputRef.current.value = "";
    onChange(null);
  };
  const Icon = value?.type?.startsWith("audio/") ? FileAudio : value ? FileText : accept === "image/*" ? ImagePlus : Upload;

  return (
    <div
      data-file-field
      data-tone={light ? "stage" : "default"}
      onDragOver={(event) => { event.preventDefault(); if (!isDisabled()) setOver(true); }}
      onDragLeave={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setOver(false); }}
      onDrop={(event) => {
        event.preventDefault(); setOver(false);
        if (!isDisabled() && event.dataTransfer.files?.[0]) onChange(event.dataTransfer.files[0]);
      }}
      className={cn("group/file min-w-0 rounded-md border bg-white/[0.02] transition-colors hover:border-white/30 hover:bg-white/[0.035] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-primary/25", value ? "border-white/[0.12]" : "border-dashed border-white/[0.18]", over && "border-primary/70 bg-primary/[0.06]", disabled && "pointer-events-none opacity-50")}
    >
      <input id={field.id} ref={inputRef} type="file" accept={accept} disabled={disabled} tabIndex={-1} aria-label="Selecionar arquivo" aria-describedby={field.descriptionId} className="sr-only" onChange={(event) => { if (event.target.files?.[0]) onChange(event.target.files[0]); }} />
      {value ? (
        <div className="flex min-w-0 items-center gap-3 p-3">
          {preview ? <img src={preview} alt="Prévia do arquivo selecionado" className="h-12 w-12 shrink-0 rounded-md border border-white/10 object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white/[0.05] text-muted-foreground"><Icon size={20} /></span>}
          <div className="min-w-0 flex-1">
            <p title={value.name} className="truncate text-sm font-medium text-white/90">{value.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(value.size)} · Selecionado</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button type="button" onClick={choose} disabled={disabled} aria-label="Substituir arquivo" title="Substituir arquivo" className="dz-icon-button h-9 w-9"><Replace size={16} /></button>
            <button type="button" onClick={clear} disabled={disabled} aria-label="Remover arquivo" title="Remover arquivo" className="dz-icon-button h-9 w-9 hover:bg-red-500/10 hover:text-red-300"><X size={16} /></button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={disabled} onClick={choose} className="flex min-h-24 w-full min-w-0 items-center gap-3 rounded-md px-4 py-4 text-left outline-none focus-visible:outline-none disabled:opacity-50">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/[0.05] text-muted-foreground"><Icon size={19} /></span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-white/85">Selecionar arquivo <span className="font-normal text-muted-foreground">ou arrastar aqui</span></span>
            {hint && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{hint}</span>}
          </span>
        </button>
      )}
    </div>
  );
}
