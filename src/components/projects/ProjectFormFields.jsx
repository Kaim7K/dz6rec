import React from "react";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateField from "@/components/ui/date-field";
import FileField from "@/components/ui/file-field";
import { TYPE, STATUS, STATUS_ORDER } from "@/lib/music";
import { STATUS_COLORS, TYPE_COLORS } from "@/lib/choiceColors";

// Shared presentation for create/edit. Saving and validation stay in their dialogs.
export default function ProjectFormFields({ form, set, artists, cover, setCover, loading, existingUrl = "", onRemoveExisting = undefined, removed = false, children = null }) {
  return (
    <div className="dz-project-form-grid">
      <div className="min-w-0 space-y-5">
        <div className="dz-form-section-heading">Informações do projeto</div>
        <Field label="Nome do projeto"><Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex. Noite Clara" /></Field>
        <Field label="Artista principal"><Select value={form.main_artist_id} onValueChange={v => set("main_artist_id", v)}><SelectTrigger><SelectValue placeholder="Selecionar artista" /></SelectTrigger><SelectContent>{artists.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Participações"><Input value={form.featuring} onChange={e => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
        <div className="dz-form-columns">
          <Field label="Tipo"><Select value={form.type} onValueChange={v => set("type", v)}><SelectTrigger accentColor={TYPE_COLORS[form.type]}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k} accentColor={TYPE_COLORS[k]}>{v}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Status"><Select value={form.status} onValueChange={v => set("status", v)}><SelectTrigger accentColor={STATUS_COLORS[form.status]}><SelectValue /></SelectTrigger><SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s} accentColor={STATUS_COLORS[s]}>{STATUS[s]}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Descrição (opcional)"><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Breve contexto do projeto" /></Field>
      </div>
      <div className="dz-project-form-aside min-w-0 space-y-5">
        <div className="dz-form-section-heading">Lançamento</div>
        <Field label="Capa">
          <FileField appearance="artwork" value={cover} onChange={setCover} disabled={loading} existingUrl={existingUrl} existingLabel="Capa atual" onRemoveExisting={onRemoveExisting} removeLabel="Remover capa" accept="image/*" hint="PNG ou JPG · Proporção 1:1" />
          {removed && !cover && <p role="status" className="text-xs text-muted-foreground">A capa será removida ao salvar.</p>}
        </Field>
        <Field label="Lançamento previsto"><DateField value={form.release_date} onChange={v => set("release_date", v)} placeholder="Selecionar data" /></Field>
        {children}
      </div>
    </div>
  );
}
