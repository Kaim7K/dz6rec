import React, { useState } from "react";
import { apiClient } from "@/api/appClient";
import FileField from "@/components/ui/file-field";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/music";
import { validateSquareCover } from "@/lib/cover";
import { toast } from "@/components/ui/use-toast";
import ArtifactReviewDialog, { ReviewBadge } from "./ArtifactReviewDialog";
import { FileAudio, FileImage, FileText, Upload } from "lucide-react";

const TYPES = { capa: { label: "Capa", Icon: FileImage }, audio: { label: "Áudio", Icon: FileAudio }, documento: { label: "Documento", Icon: FileText }, referencia: { label: "Referência", Icon: FileText } };

export default function ProjectFiles({ project, files, defaultReviewerId, onChanged }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("referencia");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const submit = async event => {
    event.preventDefault();
    if (loading || (!name.trim() && !file)) return;
    setLoading(true); setError(""); setProgress(0);
    try {
      if (category === "capa" && file) await validateSquareCover(file);
      const file_url = file ? await uploadFile(file, { onProgress: setProgress }) : "";
      await apiClient.entities.ProjectFile.create({ project_id: project.id, name: name.trim() || file?.name || "Arquivo", category, file_url, status: "recebido" });
      setName(""); setFile(null); onChanged(); toast({ title: "Arquivo adicionado" });
    } catch (err) { setError(err.message || "Não foi possível enviar o arquivo. Seus dados foram mantidos para tentar novamente."); }
    finally { setLoading(false); setProgress(0); }
  };
  return <section id={`project-files-${project.id}`} className="min-w-0">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="dz-module-title">Arquivos</h2><span className="text-xs text-muted-foreground">{files.length} itens</span></div>
    <div className="border-y border-white/[0.05]">
      {files.map(entry => {
        const { Icon, label } = TYPES[entry.category] || TYPES.documento;
        return <article key={entry.id} className="flex min-w-0 flex-wrap items-center gap-3 border-b border-white/[0.045] py-3 last:border-0">
          {entry.category === "capa" && entry.file_url ? <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-black"><img src={entry.file_url} alt="" className="h-full w-full object-contain" /></div> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.025] text-muted-foreground"><Icon size={16} /></span>}
          <div className="min-w-0 flex-1 basis-36"><p title={entry.name} className="truncate text-sm text-white/85">{entry.name}</p><div className="mt-1 flex flex-wrap gap-x-2 gap-y-1"><span className="text-xs text-muted-foreground">{label}</span><ReviewBadge entity="ProjectFile" artifact={entry} /></div>{entry.reviewer_name && <p className="mt-1 truncate text-xs text-muted-foreground">Revisor: {entry.reviewer_name}</p>}</div>
          <div className="flex shrink-0 items-center gap-3">{entry.file_url && <a href={entry.file_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-white">Abrir</a>}<Button type="button" variant="outline" disabled={!entry.file_url} aria-label={`Revisar arquivo ${entry.name}`} onClick={() => setReview(entry)}>Revisar</Button></div>
        </article>;
      })}
      {!files.length && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum arquivo anexado.</p>}
    </div>
    <form onSubmit={submit} className="mt-4 min-w-0 space-y-3">
      {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <fieldset disabled={loading} className="min-w-0 space-y-3">
        <label className="block space-y-1.5 text-xs text-muted-foreground"><span>Nome do arquivo</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Nome do arquivo" className="dz-input w-full" /></label>
        <label className="block space-y-1.5 text-xs text-muted-foreground"><span>Categoria do arquivo</span><select aria-label="Categoria do arquivo" value={category} onChange={event => setCategory(event.target.value)} className="dz-input w-full">{Object.entries(TYPES).map(([key, type]) => <option key={key} value={key}>{type.label}</option>)}</select></label>
        <FileField value={file} onChange={setFile} disabled={loading} accept={category === "capa" ? "image/*" : category === "audio" ? "audio/*" : ""} hint={category === "capa" ? "Capa quadrada, proporção 1:1." : "Arquivo, áudio ou referência do projeto."} />
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="min-h-4 text-xs text-muted-foreground">{loading ? `Enviando… ${Math.round(progress || 0)}%` : ""}</p><Button type="submit" disabled={loading || (!file && !name.trim())}><Upload size={14} />{loading ? "Enviando..." : "Adicionar arquivo"}</Button></div>
    </form>
    {review && <ArtifactReviewDialog entity="ProjectFile" artifact={review} project={project} defaultReviewerId={defaultReviewerId} onClose={() => setReview(null)} onSaved={onChanged} />}
  </section>;
}
