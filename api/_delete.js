// One PostgreSQL statement: a failure rolls back the parent and every child.
import { record } from "./_utils.js";

export async function deleteRecordTrees(sql, entity, ids) {
  const relation = entity === 'Project' ? 'project_id' : 'template_id';
  const rows = await sql`WITH targets AS (
    SELECT id FROM app_records WHERE entity = ${entity}
      AND id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))
  ), tracks AS (
    SELECT id FROM app_records WHERE entity = 'Track'
      AND (id IN (SELECT id FROM targets)
        OR (${entity} = 'Project' AND data->>'project_id' IN (SELECT id FROM targets)))
  ), sections AS (
    SELECT id FROM app_records WHERE entity = 'ChecklistSection'
      AND ${entity} <> 'Track' AND data->>${relation} IN (SELECT id FROM targets)
  ), removed AS (
    DELETE FROM app_records r WHERE
      (r.entity = ${entity} AND r.id IN (SELECT id FROM targets))
      OR (${entity} = 'Project' AND r.entity IN ('Track', 'ChecklistSection', 'ChecklistItem', 'ActivityLog', 'Notification', 'ProjectFile', 'ProjectMessage') AND r.data->>'project_id' IN (SELECT id FROM targets))
      OR (r.entity = 'TrackVersion' AND r.data->>'track_id' IN (SELECT id FROM tracks))
      OR (r.entity = 'ChecklistSection' AND r.id IN (SELECT id FROM sections))
      OR (r.entity IN ('ChecklistItem', 'ChecklistNote') AND r.data->>'section_id' IN (SELECT id FROM sections))
    RETURNING id, data
  ), counted AS (
    UPDATE app_records AS project
    SET data = project.data || jsonb_build_object('track_count', (
      SELECT count(*)::int FROM app_records AS track WHERE track.entity = 'Track'
        AND track.data->>'project_id' = project.id AND track.id NOT IN (SELECT id FROM removed)
    )), updated_date = now()
    WHERE ${entity} = 'Track' AND project.entity = 'Project'
      AND project.id IN (SELECT data->>'project_id' FROM removed)
  ) SELECT (SELECT count(*)::int FROM targets) AS count, count(*)::int AS deleted_count FROM removed`;
  return { ok: true, count: rows[0].count, deleted_count: rows[0].deleted_count };
}

export async function deleteTrackVersions(sql, ids) {
  const [result] = await sql`
    WITH removed AS (
      DELETE FROM app_records WHERE entity = 'TrackVersion'
        AND id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))
      RETURNING id, data
    ), updated AS (
      UPDATE app_records AS track
      SET data = track.data || '{"current_version_id":"","audio_url":"","version_label":""}'::jsonb,
          updated_date = now()
      WHERE track.entity = 'Track' AND EXISTS (
        SELECT 1 FROM removed WHERE removed.data->>'track_id' = track.id
          AND (track.data->>'current_version_id' = removed.id
            OR (COALESCE(track.data->>'current_version_id', '') = ''
              AND NULLIF(track.data->>'audio_url', '') = removed.data->>'audio_url'))
      )
      RETURNING track.*
    )
    SELECT (SELECT count(*)::int FROM removed) AS count,
      COALESCE((SELECT jsonb_agg(updated) FROM updated), '[]'::jsonb) AS tracks
  `;
  return { ok: true, count: result.count, tracks: result.tracks.map(record) };
}
