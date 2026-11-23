import { neon } from "@neondatabase/serverless";

let sqlClient;
let ready;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

export async function ensureDatabase() {
  if (ready) return ready;
  ready = (async () => {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS app_records (
        id text PRIMARY KEY,
        entity text NOT NULL,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_date timestamptz NOT NULL DEFAULT now(),
        updated_date timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS app_records_entity_idx ON app_records(entity)`;
    await sql`CREATE INDEX IF NOT EXISTS app_records_entity_created_idx ON app_records(entity, created_date DESC, id DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS app_records_data_gin_idx ON app_records USING gin(data)`;
    await sql`CREATE TABLE IF NOT EXISTS app_migrations (id text PRIMARY KEY)`;
    await sql`
      WITH migration AS (
        INSERT INTO app_migrations (id) VALUES ('cargo-artista')
        ON CONFLICT DO NOTHING RETURNING id
      )
      INSERT INTO app_records (id, entity, data)
      SELECT 'cargo-artista-padrao', 'Cargo', '{"name":"Artista","color":"#b91c1c"}'::jsonb
      FROM migration
      WHERE NOT EXISTS (
        SELECT 1 FROM app_records WHERE entity = 'Cargo' AND lower(btrim(data->>'name')) = 'artista'
      )
      ON CONFLICT DO NOTHING
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id text PRIMARY KEY,
        email text UNIQUE NOT NULL,
        password_hash text,
        role text NOT NULL DEFAULT 'user',
        permissao text NOT NULL DEFAULT 'membro',
        full_name text,
        cargo jsonb NOT NULL DEFAULT '[]'::jsonb,
        handle text,
        status text NOT NULL DEFAULT 'ativo',
        photo_url text,
        reset_token text,
        reset_expires_at timestamptz,
        created_date timestamptz NOT NULL DEFAULT now(),
        updated_date timestamptz NOT NULL DEFAULT now()
      )
    `;
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}
