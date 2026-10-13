import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";
import { handleUpload as handleBlobUpload } from "@vercel/blob/client";
import formidable from "formidable";
import { ensureDatabase, getSql } from "./_db.js";
import {
  currentUser,
  id,
  methodNotAllowed,
  normalizePatch,
  publicUser,
  readJson,
  record,
  send,
  signOAuthState,
  signToken,
  sortRows,
  verifyOAuthState,
} from "./_utils.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const userFields = ["role", "permissao", "full_name", "cargo", "handle", "status", "photo_url"];

function isSuperadmin(user) {
  return user?.permissao === "superadmin";
}

function pathParts(req) {
  const url = new URL(req.url, "http://localhost");
  return url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
}

function filtersMatch(where = {}, row) {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

async function listUsers(sql, sort) {
  const rows = await sql`SELECT * FROM app_users ORDER BY created_date DESC`;
  return sortRows(rows.map(publicUser), sort);
}

async function getUser(sql, userId) {
  const rows = await sql`SELECT * FROM app_users WHERE id = ${userId} LIMIT 1`;
  return publicUser(rows[0]);
}

async function updateUser(sql, userId, data) {
  const current = await getUser(sql, userId);
  if (!current) return null;
  const next = { ...current, ...Object.fromEntries(Object.entries(data).filter(([key]) => userFields.includes(key))) };
  const rows = await sql`
    UPDATE app_users
    SET role = ${next.role || "user"},
        permissao = ${next.permissao || "membro"},
        full_name = ${next.full_name || null},
        cargo = ${JSON.stringify(next.cargo || [])}::jsonb,
        handle = ${next.handle || null},
        status = ${next.status || "ativo"},
        photo_url = ${next.photo_url || null},
        updated_date = now()
    WHERE id = ${userId}
    RETURNING *
  `;
  return publicUser(rows[0]);
}

function appOrigin(req) {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

function safeReturnPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

function googleCallbackRedirect(req, params) {
  const hash = new URLSearchParams(params).toString();
  return `${appOrigin(req)}/auth/google/callback#${hash}`;
}

async function handleGoogleAuth(req, res, subAction, sql) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return send(res, 503, { error: "Login com Google ainda nao foi configurado" });
  }

  const callbackUrl = `${appOrigin(req)}/api/auth/google/callback`;

  if (!subAction) {
    if (req.method !== "GET") return methodNotAllowed(res);
    const url = new URL(req.url, appOrigin(req));
    const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: signOAuthState(returnTo),
    });
    return redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  if (subAction !== "callback") return send(res, 404, { error: "Not found" });
  if (req.method !== "GET") return methodNotAllowed(res);

  const url = new URL(req.url, appOrigin(req));
  const googleError = url.searchParams.get("error");
  if (googleError) {
    return redirect(res, googleCallbackRedirect(req, { error: "Login com Google cancelado" }));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirect(res, googleCallbackRedirect(req, { error: "Resposta de login invalida" }));
  }

  let returnTo = "/";
  try {
    returnTo = safeReturnPath(verifyOAuthState(state).returnTo);
  } catch {
    return redirect(res, googleCallbackRedirect(req, { error: "Sessao de login expirada. Tente novamente." }));
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.access_token) {
    console.error("Google token exchange failed", tokens.error);
    return redirect(res, googleCallbackRedirect(req, { error: "Nao foi possivel concluir o login com Google" }));
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.email || profile.email_verified !== true) {
    return redirect(res, googleCallbackRedirect(req, { error: "O Google nao confirmou este endereco de email" }));
  }

  let rows = await sql`SELECT * FROM app_users WHERE lower(email) = lower(${profile.email}) LIMIT 1`;
  if (!rows.length) {
    const countRows = await sql`SELECT count(*)::int AS count FROM app_users`;
    const firstUser = countRows[0].count === 0;
    rows = await sql`
      INSERT INTO app_users (id, email, role, permissao, full_name, cargo, status, photo_url)
      VALUES (${id("usr")}, ${profile.email}, ${firstUser ? "admin" : "user"}, ${firstUser ? "superadmin" : "membro"}, ${profile.name || null}, '[]'::jsonb, ${firstUser ? "ativo" : "pendente"}, ${profile.picture || null})
      RETURNING *
    `;
  } else {
    rows = await sql`
      UPDATE app_users
      SET full_name = COALESCE(full_name, ${profile.name || null}),
          photo_url = COALESCE(photo_url, ${profile.picture || null}),
          updated_date = now()
      WHERE id = ${rows[0].id}
      RETURNING *
    `;
  }

  return redirect(res, googleCallbackRedirect(req, {
    access_token: signToken(rows[0]),
    returnTo,
  }));
}

async function handleAuth(req, res, action, subAction, sql) {
  if (action === "google") return handleGoogleAuth(req, res, subAction, sql);

  if (action === "me") {
    if (req.method !== "GET") return methodNotAllowed(res);
    const user = await currentUser(req, sql);
    if (!user) return send(res, 401, { error: "Authentication required" });
    return send(res, 200, publicUser(user));
  }

  if (action === "login") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const { email, password } = await readJson(req);
    const rows = await sql`SELECT * FROM app_users WHERE lower(email) = lower(${email || ""}) LIMIT 1`;
    const user = rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(password || "", user.password_hash))) {
      return send(res, 401, { error: "Usuario ou senha invalidos" });
    }
    return send(res, 200, { access_token: signToken(user), user: publicUser(user) });
  }

  if (action === "register") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const { email, password, full_name } = await readJson(req);
    if (!email || !password) return send(res, 400, { error: "Email and password are required" });
    const existing = await sql`SELECT id FROM app_users WHERE lower(email) = lower(${email}) LIMIT 1`;
    if (existing.length) return send(res, 409, { error: "Este email ja esta cadastrado" });
    const countRows = await sql`SELECT count(*)::int AS count FROM app_users`;
    const firstUser = countRows[0].count === 0;
    const userId = id("usr");
    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO app_users (id, email, password_hash, role, permissao, full_name, cargo, status)
      VALUES (${userId}, ${email}, ${hash}, ${firstUser ? "admin" : "user"}, ${firstUser ? "superadmin" : "membro"}, ${full_name || null}, '[]'::jsonb, ${firstUser ? "ativo" : "pendente"})
      RETURNING *
    `;
    return send(res, 201, { access_token: signToken(rows[0]), user: publicUser(rows[0]) });
  }

  if (action === "update-me") {
    if (req.method !== "PATCH") return methodNotAllowed(res);
    const user = await currentUser(req, sql);
    if (!user) return send(res, 401, { error: "Authentication required" });
    const data = await readJson(req);
    return send(res, 200, await updateUser(sql, user.id, data));
  }

  if (action === "reset-request") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const { email } = await readJson(req);
    const token = id("reset");
    await sql`
      UPDATE app_users
      SET reset_token = ${token}, reset_expires_at = now() + interval '1 hour', updated_date = now()
      WHERE lower(email) = lower(${email || ""})
    `;
    return send(res, 200, { ok: true });
  }

  if (action === "reset") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const { resetToken, newPassword } = await readJson(req);
    if (!resetToken || !newPassword) return send(res, 400, { error: "Token and password are required" });
    const hash = await bcrypt.hash(newPassword, 12);
    const rows = await sql`
      UPDATE app_users
      SET password_hash = ${hash}, reset_token = null, reset_expires_at = null, updated_date = now()
      WHERE reset_token = ${resetToken} AND reset_expires_at > now()
      RETURNING *
    `;
    if (!rows.length) return send(res, 400, { error: "Link invalido ou expirado" });
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "Not found" });
}

async function handleUsers(req, res, action, sql) {
  if (action === "invite" && req.method === "POST") {
    const actor = await currentUser(req, sql);
    if (!isSuperadmin(actor)) return send(res, 403, { error: "Apenas superadmins podem convidar usuarios" });
    const { email, role = "user", cargo } = await readJson(req);
    if (!email) return send(res, 400, { error: "Email is required" });
    const existing = await sql`SELECT * FROM app_users WHERE lower(email) = lower(${email}) LIMIT 1`;
    if (existing.length) return send(res, 200, publicUser(existing[0]));
    const rows = await sql`
      INSERT INTO app_users (id, email, role, permissao, cargo, status)
      VALUES (${id("usr")}, ${email}, ${role}, 'membro', ${JSON.stringify(cargo ? [cargo] : [])}::jsonb, 'ativo')
      RETURNING *
    `;
    return send(res, 201, publicUser(rows[0]));
  }
  return send(res, 404, { error: "Not found" });
}

async function handleEntities(req, res, parts, sql) {
  const entity = parts[1];
  const entityId = parts[2];
  const action = parts[3];
  if (!entity) return send(res, 400, { error: "Entity is required" });

  if (entity === "User") {
    const actor = await currentUser(req, sql);
    if (req.method === "GET" && !entityId) {
      const sort = new URL(req.url, "http://localhost").searchParams.get("sort");
      return send(res, 200, await listUsers(sql, sort));
    }
    if (req.method === "GET" && entityId) return send(res, 200, await getUser(sql, entityId));
    if (!isSuperadmin(actor)) return send(res, 403, { error: "Apenas superadmins podem gerenciar usuarios" });
    if (req.method === "PATCH" && entityId) return send(res, 200, await updateUser(sql, entityId, await readJson(req)));
    if (req.method === "DELETE" && entityId) {
      await sql`DELETE FROM app_users WHERE id = ${entityId}`;
      return send(res, 200, { ok: true });
    }
  }

  if (entity === "Cargo" && req.method !== "GET") {
    const actor = await currentUser(req, sql);
    if (!isSuperadmin(actor)) return send(res, 403, { error: "Apenas superadmins podem configurar cargos" });
  }

  if (req.method === "GET" && entityId) {
    const rows = await sql`SELECT * FROM app_records WHERE entity = ${entity} AND id = ${entityId} LIMIT 1`;
    return rows.length ? send(res, 200, record(rows[0])) : send(res, 404, { error: "Record not found" });
  }

  if (req.method === "GET") {
    const params = new URL(req.url, "http://localhost").searchParams;
    const sort = params.get("sort");
    const filter = params.get("filter");
    const rows = filter
      ? await sql`SELECT * FROM app_records WHERE entity = ${entity} AND data @> ${filter}::jsonb`
      : await sql`SELECT * FROM app_records WHERE entity = ${entity}`;
    return send(res, 200, sortRows(rows.map(record), sort));
  }

  if (req.method === "POST" && action === "bulk") {
    const { items = [] } = await readJson(req);
    const created = [];
    for (const item of items) {
      const recId = id(entity.toLowerCase());
      const rows = await sql`
        INSERT INTO app_records (id, entity, data)
        VALUES (${recId}, ${entity}, ${JSON.stringify(item)}::jsonb)
        RETURNING *
      `;
      created.push(record(rows[0]));
    }
    return send(res, 201, created);
  }

  if (req.method === "POST" && !entityId) {
    const data = await readJson(req);
    const recId = id(entity.toLowerCase());
    const rows = await sql`
      INSERT INTO app_records (id, entity, data)
      VALUES (${recId}, ${entity}, ${JSON.stringify(data)}::jsonb)
      RETURNING *
    `;
    return send(res, 201, record(rows[0]));
  }

  if (req.method === "PATCH" && action === "bulk") {
    const { items = [] } = await readJson(req);
    const updated = [];
    for (const item of items) {
      const { id: itemId, ...data } = item;
      const rows = await sql`
        UPDATE app_records
        SET data = data || ${JSON.stringify(data)}::jsonb, updated_date = now()
        WHERE entity = ${entity} AND id = ${itemId}
        RETURNING *
      `;
      if (rows[0]) updated.push(record(rows[0]));
    }
    return send(res, 200, updated);
  }

  if (req.method === "PATCH" && action === "many") {
    const { where = {}, patch = {} } = await readJson(req);
    const rows = await sql`SELECT * FROM app_records WHERE entity = ${entity}`;
    const changes = normalizePatch(patch);
    const updated = [];
    for (const row of rows.map(record).filter((item) => filtersMatch(where, item))) {
      const saved = await sql`
        UPDATE app_records
        SET data = data || ${JSON.stringify(changes)}::jsonb, updated_date = now()
        WHERE entity = ${entity} AND id = ${row.id}
        RETURNING *
      `;
      if (saved[0]) updated.push(record(saved[0]));
    }
    return send(res, 200, updated);
  }

  if (req.method === "PATCH" && entityId) {
    const data = await readJson(req);
    const rows = await sql`
      UPDATE app_records
      SET data = data || ${JSON.stringify(data)}::jsonb, updated_date = now()
      WHERE entity = ${entity} AND id = ${entityId}
      RETURNING *
    `;
    return rows.length ? send(res, 200, record(rows[0])) : send(res, 404, { error: "Record not found" });
  }

  if (req.method === "DELETE" && action === "many") {
    const { where = {} } = await readJson(req);
    const rows = await sql`SELECT * FROM app_records WHERE entity = ${entity}`;
    const matches = rows.map(record).filter((item) => filtersMatch(where, item));
    for (const item of matches) {
      await sql`DELETE FROM app_records WHERE entity = ${entity} AND id = ${item.id}`;
    }
    return send(res, 200, { ok: true, count: matches.length });
  }

  if (req.method === "DELETE" && entityId) {
    await sql`DELETE FROM app_records WHERE entity = ${entity} AND id = ${entityId}`;
    return send(res, 200, { ok: true });
  }

  return methodNotAllowed(res);
}

async function assertActiveUploadUser(req, res, sql) {
  const user = await currentUser(req, sql);
  if (!user) {
    send(res, 401, { error: "Authentication required" });
    return null;
  }
  if (user.status !== "ativo") {
    send(res, 403, { error: "Seu acesso ainda nao foi aprovado" });
    return null;
  }
  return user;
}

async function handleMultipartUpload(req, res, sql) {
  const user = await assertActiveUploadUser(req, res, sql);
  if (!user) return;
  if (req.method !== "POST") return methodNotAllowed(res);
  const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 1024 * 1024 * 1024 });
  const { files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, parsedFiles) => (err ? reject(err) : resolve({ fields, files: parsedFiles })));
  });
  const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!uploaded) return send(res, 400, { error: "File is required" });

  const file = await import("node:fs/promises").then((fs) => fs.readFile(uploaded.filepath));
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const mime = uploaded.mimetype || "application/octet-stream";
    return send(res, 200, { file_url: `data:${mime};base64,${file.toString("base64")}` });
  }
  try {
    const blob = await put(`uploads/${Date.now()}-${uploaded.originalFilename || "file"}`, file, {
      access: "public",
      contentType: uploaded.mimetype || undefined,
    });
    return send(res, 200, { file_url: blob.url });
  } catch (error) {
    console.error("Server upload to Blob failed", error);
    return send(res, 502, { error: error.message || "Nao foi possivel salvar o arquivo no Blob" });
  }
}

async function handleUpload(req, res, sql) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return handleMultipartUpload(req, res, sql);
  }

  const body = await readJson(req);
  if (body.type !== "blob.upload-completed") {
    const user = await assertActiveUploadUser(req, res, sql);
    if (!user) return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return send(res, 503, { error: "Upload de arquivos grandes exige BLOB_READ_WRITE_TOKEN configurado" });
  }

  try {
    const jsonResponse = await handleBlobUpload({
      body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("uploads/")) {
          throw new Error("Caminho de upload invalido");
        }
        return {
          access: "public",
          allowedContentTypes: ["audio/*", "image/*", "video/*", "application/pdf", "application/octet-stream"],
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });

    return send(res, 200, jsonResponse);
  } catch (error) {
    console.error("Blob client token failed", error);
    return send(res, 400, { error: error.message || "Nao foi possivel preparar o upload" });
  }
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();
    const sql = getSql();
    const parts = pathParts(req);
    if (parts[0] === "auth") return handleAuth(req, res, parts[1], parts[2], sql);
    if (parts[0] === "upload") return handleUpload(req, res, sql);
    const user = await currentUser(req, sql);
    if (!user) return send(res, 401, { error: "Authentication required" });
    if (user.status !== "ativo") return send(res, 403, { error: "Seu acesso ainda nao foi aprovado" });
    if (parts[0] === "users") return handleUsers(req, res, parts[1], sql);
    if (parts[0] === "entities") return handleEntities(req, res, parts, sql);
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error.message || "Internal server error" });
  }
}
