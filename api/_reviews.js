import { id, readJson, record, send } from "./_utils.js";
import { prepareReview } from "../src/lib/reviews.js";

export async function handleReview(req, res, sql, actor) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const { entity, record_id, action, reviewer_id, comment, review_request_id } = await readJson(req);
  if (!["TrackVersion", "ProjectFile"].includes(entity) || typeof record_id !== "string") return send(res, 400, { error: "Arquivo inválido." });
  const [row] = await sql`SELECT * FROM app_records WHERE entity = ${entity} AND id = ${record_id} LIMIT 1`;
  if (!row) return send(res, 404, { error: "Arquivo não encontrado." });
  const artifact = record(row);
  let projectId = artifact.project_id;
  if (entity === "TrackVersion") {
    const [track] = await sql`SELECT * FROM app_records WHERE entity = 'Track' AND id = ${artifact.track_id} LIMIT 1`;
    projectId = track?.data?.project_id;
  }
  if (!projectId) return send(res, 400, { error: "Este arquivo não está associado a um projeto." });
  const [project] = await sql`SELECT * FROM app_records WHERE entity = 'Project' AND id = ${projectId} LIMIT 1`;
  if (!project) return send(res, 404, { error: "Projeto não encontrado." });
  let reviewer;
  if (action === "request") [reviewer] = await sql`SELECT id, full_name, email, status FROM app_users WHERE id = ${reviewer_id || ""} LIMIT 1`;
  const patch = prepareReview({ entity, artifact, action, reviewer, actor, comment, expectedRequestId: review_request_id, now: new Date().toISOString(), requestId: id("review") });
  const verb = { request: "Revisão solicitada", approve: "Arquivo aprovado", request_changes: "Ajustes solicitados" }[action];
  const log = { project_id: projectId, text: `${verb}: ${artifact.name || "Arquivo"}${patch.review_comment ? ` — ${patch.review_comment}` : ""}`, user_id: actor.id, user_name: actor.full_name || actor.email, artifact_entity: entity, artifact_id: artifact.id, review_action: action, review_status: patch.review_status, review_comment: patch.review_comment, reviewer_id: patch.reviewer_id || artifact.reviewer_id };
  const recipient = action === "request" ? reviewer.id : artifact.review_requested_by;
  const notification = { user_id: recipient, project_id: projectId, text: `${verb}: ${artifact.name || "Arquivo"}`, link: `/projetos/${projectId}?tab=${entity === "TrackVersion" ? "faixas" : "operacao"}&review=${entity}&record=${encodeURIComponent(artifact.id)}`, read: false };
  // Keep the decision and its history together, and reject concurrent edits.
  const rows = await sql`
    WITH updated AS (
      UPDATE app_records SET data = data || ${JSON.stringify(patch)}::jsonb, updated_date = now()
      WHERE entity = ${entity} AND id = ${record_id} AND data = ${JSON.stringify(row.data)}::jsonb
      RETURNING *
    ), logged AS (
      INSERT INTO app_records (id, entity, data)
      SELECT ${id("activitylog")}, 'ActivityLog', ${JSON.stringify(log)}::jsonb FROM updated RETURNING id
    ), notified AS (
      INSERT INTO app_records (id, entity, data)
      SELECT ${id("notification")}, 'Notification', ${JSON.stringify(notification)}::jsonb FROM updated
      WHERE ${!!recipient && recipient !== actor.id} RETURNING id
    ) SELECT updated.* FROM updated CROSS JOIN logged
  `;
  if (!rows.length) return send(res, 409, { error: "O arquivo foi alterado por outra pessoa. Atualize e tente novamente." });
  return send(res, 200, record(rows[0]));
}
