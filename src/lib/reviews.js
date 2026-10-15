export const REVIEW_LABELS = { recebido: "Sem revisão", revisao: "Em revisão", ajuste: "Ajustes solicitados", aprovado: "Aprovado" };
export const REVIEW_TONES = { recebido: "text-muted-foreground", revisao: "text-amber-300", ajuste: "text-red-200", aprovado: "text-emerald-300" };

export function artifactUrl(entity, artifact) {
  return entity === "TrackVersion" ? artifact.audio_url : artifact.file_url;
}

export function reviewStatus(entity, artifact) {
  if (artifact.review_file_url && artifact.review_file_url !== artifactUrl(entity, artifact)) return "recebido";
  return artifact.review_status || (entity === "ProjectFile" ? artifact.status : null) || "recebido";
}

export function canDecideReview(artifact, actor) {
  return !!actor && (artifact.reviewer_id === actor.id || actor.permissao === "superadmin");
}

export function canRequestReview(artifact, actor) {
  return !!actor && (!artifact.review_requested_by || artifact.review_requested_by === actor.id || actor.permissao === "superadmin");
}

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }

export function prepareReview({ entity, artifact, action, reviewer, actor, comment = "", expectedRequestId, now, requestId }) {
  if (!["TrackVersion", "ProjectFile"].includes(entity)) fail("Tipo de arquivo inválido.");
  if (!actor || actor.status !== "ativo") fail("Acesso não autorizado.", 403);
  if (!["request", "approve", "request_changes"].includes(action)) fail("Ação de revisão inválida.");
  const url = artifactUrl(entity, artifact);
  if (!url) fail("Anexe um arquivo antes de solicitar uma revisão.");
  const text = String(comment || "").trim();
  if (text.length > 4000) fail("O comentário deve ter até 4.000 caracteres.");
  if (action === "request") {
    if (!canRequestReview(artifact, actor)) fail("Somente quem solicitou a revisão ou um superadmin pode trocar o revisor ou solicitar uma nova revisão.", 403);
    if (!reviewer || reviewer.status !== "ativo") fail("Selecione um revisor com acesso ativo.");
    return {
      review_status: "revisao", ...(entity === "ProjectFile" ? { status: "revisao" } : {}),
      reviewer_id: reviewer.id, reviewer_name: reviewer.full_name || reviewer.email,
      review_request_id: requestId, review_file_url: url, review_requested_by: actor.id,
      review_requested_at: now, review_comment: text, review_decided_by: null, review_decided_name: null, review_decided_at: null,
    };
  }
  if (!canDecideReview(artifact, actor)) fail("Somente o revisor selecionado ou um superadmin pode decidir esta revisão.", 403);
  if (artifact.review_status !== "revisao" || !expectedRequestId || expectedRequestId !== artifact.review_request_id || artifact.review_file_url !== url) fail("Esta revisão foi alterada. Atualize os dados e solicite uma nova revisão, se necessário.", 409);
  if (action === "request_changes" && !text) fail("Descreva os ajustes necessários.");
  const status = action === "approve" ? "aprovado" : "ajuste";
  return { review_status: status, ...(entity === "ProjectFile" ? { status } : {}), review_comment: text, review_decided_by: actor.id, review_decided_name: actor.full_name || actor.email, review_decided_at: now };
}

export function protectedReviewPatch(entity, data, creating = false) {
  if (!["TrackVersion", "ProjectFile"].includes(entity)) return false;
  const patch = data?.$set || data || {};
  return Object.keys(patch).some(key => key.startsWith("review")) || (entity === "ProjectFile" && Object.hasOwn(patch, "status") && (!creating || patch.status !== "recebido"));
}
