// One PostgreSQL statement: a failure rolls back the parent and every child.
// Keep this limited to the application's existing project/template relationships.
export async function deleteRecordTrees(sql, entity, ids) {
  const relation = entity === 'Project' ? 'project_id' : 'template_id';
  const rows = await sql`WITH targets AS (
    SELECT id FROM app_records WHERE entity = ${entity}
      AND id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))
  ), tracks AS (
    SELECT id FROM app_records WHERE entity = 'Track' AND ${entity} = 'Project'
      AND data->>'project_id' IN (SELECT id FROM targets)
  ), sections AS (
    SELECT id FROM app_records WHERE entity = 'ChecklistSection'
      AND data->>${relation} IN (SELECT id FROM targets)
  ), removed AS (
    DELETE FROM app_records r WHERE
      (r.entity = ${entity} AND r.id IN (SELECT id FROM targets))
      OR (${entity} = 'Project' AND r.entity IN ('Track', 'ChecklistSection', 'ChecklistItem', 'ActivityLog', 'Notification', 'ProjectFile', 'ProjectMessage') AND r.data->>'project_id' IN (SELECT id FROM targets))
      OR (r.entity = 'TrackVersion' AND r.data->>'track_id' IN (SELECT id FROM tracks))
      OR (r.entity = 'ChecklistSection' AND r.id IN (SELECT id FROM sections))
      OR (r.entity IN ('ChecklistItem', 'ChecklistNote') AND r.data->>'section_id' IN (SELECT id FROM sections))
    RETURNING id
  ) SELECT (SELECT count(*)::int FROM targets) AS count, count(*)::int AS deleted_count FROM removed`;
  return { ok: true, count: rows[0].count, deleted_count: rows[0].deleted_count };
}
