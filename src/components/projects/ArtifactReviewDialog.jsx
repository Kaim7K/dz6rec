import { REVIEW_COLORS } from "@/lib/choiceColors";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { artifactUrl, canDecideReview, canRequestReview, reviewStatus, REVIEW_LABELS, REVIEW_TONES } from "@/lib/reviews";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/form-field";
import { toast } from "@/components/ui/use-toast";

export function ReviewBadge({ entity, artifact }) {
  const status = reviewStatus(entity, artifact);
  return <span className={`text-xs font-medium ${REVIEW_TONES[status] || REVIEW_TONES.recebido}`}>{REVIEW_LABELS[status] || "Sem revisão"}</span>;
}

export default function ArtifactReviewDialog({ entity, artifact: initialArtifact, project, defaultReviewerId, onClose, onSaved }) {
  const [artifact, setArtifact] = useState(initialArtifact);
  const { user } = useAuth();
  const pending = reviewStatus(entity, artifact) === "revisao";
  const canDecide = pending && canDecideReview(artifact, user);
  const canRequest = canRequestReview(artifact, user);
  const [action, setAction] = useState(canDecide ? "approve" : "request");
  const [reviewerId, setReviewerId] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const url = artifactUrl(entity, artifact);
  const refresh = async () => {
    try {
      const current = await apiClient.entities[entity].get(artifact.id);
      setArtifact(current);
      setAction(reviewStatus(entity, current) === "revisao" && canDecideReview(current, user) ? "approve" : "request");
      setAttempt(n => n + 1);
    } catch (err) { setError(err.message || "Não foi possível atualizar o arquivo."); }
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiClient.entities.User.list().then(rows => {
      if (!active) return;
      const activeUsers = rows.filter(row => row.status === "ativo");
      setUsers(activeUsers);
      const preferred = artifact.reviewer_id || defaultReviewerId;
      setReviewerId(activeUsers.some(row => row.id === preferred) ? preferred : "");
    }).catch(() => { if (active) setError("Não foi possível carregar os revisores. Tente novamente."); })
      .finally(() => { if (active) setLoading(false); });
    setHistoryError(false);
    apiClient.entities.ActivityLog.filter({ artifact_entity: entity, artifact_id: artifact.id }).then(rows => {
      if (active) setHistory(rows.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }).catch(() => { if (active) setHistoryError(true); });
    return () => { active = false; };
  }, [entity, artifact.id, artifact.reviewer_id, defaultReviewerId, attempt]);

  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const saved = await apiClient.reviews.submit({ entity, record_id: artifact.id, action, reviewer_id: reviewerId, comment, review_request_id: artifact.review_request_id });
      const title = { request: "Revisão solicitada", approve: "Arquivo aprovado", request_changes: "Ajustes solicitados" }[action];
      onSaved?.(saved);
      toast({ title, description: artifact.name });
      onClose();
    } catch (err) { setError(err.message || "Não foi possível salvar a revisão. Seu comentário foi mantido."); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Revisão do arquivo</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">{artifact.name} · {project.name}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
        <div className="min-w-0 space-y-3">
          {entity === "ProjectFile" && artifact.category === "capa" && url && <div className="mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-lg border border-white/10 bg-black"><img src={url} alt={`Capa: ${artifact.name}`} className="h-full w-full object-contain" /></div>}
          {(entity === "TrackVersion" || artifact.category === "audio") && url && <audio controls preload="none" src={url} aria-label={`Ouvir ${artifact.name}`} style={{ colorScheme: "dark" }} className="w-full max-w-full" />}
          {url && <a href={url} target="_blank" rel="noreferrer" className="inline-block text-xs text-red-200 hover:text-white">Abrir arquivo original</a>}
          <div className="rounded-md border border-white/[0.08] p-3 text-sm">
            <ReviewBadge entity={entity} artifact={artifact} />
            <p className="mt-1 break-words text-xs text-muted-foreground">Revisor: {artifact.reviewer_name || "Ainda não definido"}</p>
            {artifact.review_comment && <p className="mt-2 whitespace-pre-wrap text-sm text-white/80 [overflow-wrap:anywhere]">{artifact.review_comment}</p>}
          </div>
        </div>
          {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error} <button type="button" onClick={refresh} disabled={saving} className="underline">Atualizar dados</button></p>}
          <fieldset disabled={saving || (!canRequest && !canDecide)} className="min-w-0 space-y-4">
            <Field label="Ação de revisão"><Select value={action} onValueChange={value => { if (value) setAction(value); }}><SelectTrigger accentColor={REVIEW_COLORS[action]}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="request" accentColor={REVIEW_COLORS.request} disabled={!canRequest}>Solicitar revisão</SelectItem>{canDecide && <><SelectItem value="approve" accentColor={REVIEW_COLORS.approve}>Aprovar arquivo</SelectItem><SelectItem value="request_changes" accentColor={REVIEW_COLORS.request_changes}>Solicitar ajustes</SelectItem></>}</SelectContent></Select></Field>
            {action === "request" && <Field label="Revisor do arquivo">{loading ? <Input disabled readOnly value="Carregando revisores..." /> : <Select value={reviewerId} onValueChange={value => { if (value) setReviewerId(value); }}><SelectTrigger><SelectValue placeholder="Selecionar revisor" /></SelectTrigger><SelectContent>{users.map(row => <SelectItem key={row.id} value={row.id}>{row.full_name || row.email} · {row.email}</SelectItem>)}</SelectContent></Select>}</Field>}
            {pending && !canDecide && <p className="text-xs leading-5 text-muted-foreground">A decisão está disponível para o revisor selecionado e para a administração.</p>}
            <Field label={action === "request_changes" ? "Ajustes necessários" : "Comentário (opcional)"}><Textarea required={action === "request_changes"} maxLength={4000} rows={3} value={comment} onChange={event => setComment(event.target.value)} placeholder={action === "request_changes" ? "Descreva o que precisa ser alterado." : "Orientações para esta revisão."} /></Field>
          </fieldset>
        <section className="min-w-0 space-y-3 border-t border-white/[0.08] pt-4">
          <h3 className="text-sm font-semibold">Histórico deste arquivo</h3>
          {historyError ? <p className="text-xs text-muted-foreground">Não foi possível carregar o histórico. <button type="button" onClick={() => setAttempt(n => n + 1)} className="underline">Tentar novamente</button></p> : !history.length ? <p className="text-xs text-muted-foreground">Nenhuma revisão registrada.</p> : history.map(entry => <div key={entry.id} className="min-w-0 border-l border-white/10 pl-3"><p className="whitespace-pre-wrap text-xs leading-5 text-white/80 [overflow-wrap:anywhere]">{entry.text}</p><p className="mt-1 text-2xs text-muted-foreground">{entry.user_name} · {new Date(entry.created_date).toLocaleString("pt-BR")}</p></div>)}
        </section>
          <DialogFooter><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving || !url || (action === "request" && (!canRequest || loading || !reviewerId))}>{saving ? "Salvando..." : action === "approve" ? "Aprovar" : action === "request_changes" ? "Solicitar ajustes" : "Solicitar revisão"}</Button></DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}
