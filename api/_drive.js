import crypto from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import jwt from "jsonwebtoken";
import { currentUser, id, jwtSecret, readJson, send } from "./_utils.js";

const scope = "https://www.googleapis.com/auth/drive.file";
const google = "https://www.googleapis.com";
const mediaPath = "/api/drive/audio/";
const mediaCookie = "dz6_drive_media";
const oauthCookie = "dz6_drive_state";
let initialized;

const encryptionKey = () => Buffer.from(process.env.GOOGLE_DRIVE_TOKEN_KEY || "", "base64");
const configured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL && encryptionKey().length === 32);
const appOrigin = () => new URL(process.env.APP_URL).origin;
const callbackUrl = () => appOrigin() + "/api/drive/callback";
const secure = () => process.env.APP_URL?.startsWith("https:") ? "; Secure" : "";

function setCookie(res, name, value, path, age) {
  res.setHeader("Set-Cookie", `${name}=${value}; Path=${path}; Max-Age=${age}; HttpOnly; SameSite=Lax${secure()}`);
}

function cookie(req, name) {
  return (req.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="))?.slice(name.length + 1);
}

export function refreshDriveMedia(res, actor) {
  if (!configured() || actor.status !== "ativo") return;
  res.setHeader("Cache-Control", "private, no-store");
  setCookie(res, mediaCookie, jwt.sign({ purpose: "drive-media", actor: actor.id }, jwtSecret(), { expiresIn: "15m" }), mediaPath, 900);
}

function encodeToken(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  return Buffer.concat([iv, cipher.update(value, "utf8"), cipher.final(), cipher.getAuthTag()]).toString("base64");
}

function decodeToken(value) {
  const bytes = Buffer.from(value, "base64");
  const cipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([cipher.update(bytes.subarray(12, -16)), cipher.final()]).toString("utf8");
}

function initialize(sql) {
  initialized ||= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS app_drive_connections (
      user_id text PRIMARY KEY, google_account text NOT NULL, refresh_token text NOT NULL
    )`;
    await sql`CREATE TABLE IF NOT EXISTS app_drive_audio (
      id text PRIMARY KEY, user_id text NOT NULL, google_file_id text UNIQUE NOT NULL, mime_type text NOT NULL
    )`;
  })().catch(error => { initialized = undefined; throw error; });
  return initialized;
}

async function exchange(params) {
  return fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, ...params }),
    signal: AbortSignal.timeout(15000),
  }).then(response => response.json());
}

async function accessToken(sql, userId) {
  const [row] = await sql`SELECT refresh_token FROM app_drive_connections WHERE user_id = ${userId}`;
  if (!row) return null;
  const tokens = await exchange({ grant_type: "refresh_token", refresh_token: decodeToken(row.refresh_token) });
  return tokens.access_token || null;
}

function callbackPage(res, connected) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end(`<!doctype html><meta charset="utf-8"><title>Google Drive · DZ6</title><p>${connected ? "Google Drive conectado." : "Não foi possível conectar o Drive. Se você já tinha arquivos na DZ6, reconecte a mesma conta Google."} Você pode fechar esta janela.</p><script>if(window.opener){window.opener.postMessage({type:"dz6-drive",connected:${connected}},location.origin);window.close()}</script>`);
}

async function connectCallback(req, res, sql) {
  const params = new URL(req.url, appOrigin()).searchParams;
  const state = params.get("state");
  setCookie(res, oauthCookie, "", "/api/drive/callback", 0);
  if (!state || state !== cookie(req, oauthCookie) || !params.get("code")) return callbackPage(res, false);
  try {
    const payload = jwt.verify(state, jwtSecret());
    if (payload.purpose !== "drive-oauth") return callbackPage(res, false);
    const [user] = await sql`SELECT status FROM app_users WHERE id = ${payload.actor}`;
    if (user?.status !== "ativo") return callbackPage(res, false);
    const tokens = await exchange({ grant_type: "authorization_code", code: params.get("code"), redirect_uri: callbackUrl() });
    if (!tokens.refresh_token || !tokens.access_token || !tokens.scope?.split(" ").includes(scope)) return callbackPage(res, false);
    const about = await fetch(google + "/drive/v3/about?fields=user(permissionId)", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(15000),
    }).then(response => response.json());
    const account = about.user?.permissionId;
    if (!account) return callbackPage(res, false);
    const rows = await sql`INSERT INTO app_drive_connections (user_id, google_account, refresh_token)
      VALUES (${payload.actor}, ${account}, ${encodeToken(tokens.refresh_token)})
      ON CONFLICT (user_id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token
      WHERE app_drive_connections.google_account = EXCLUDED.google_account RETURNING user_id`;
    return callbackPage(res, rows.length > 0);
  } catch {
    return callbackPage(res, false);
  }
}

async function streamAudio(req, res, sql, assetId) {
  let viewer;
  try {
    const payload = jwt.verify(cookie(req, mediaCookie), jwtSecret());
    if (payload.purpose === "drive-media") viewer = payload.actor;
  } catch {}
  if (!viewer) return send(res, 401, { error: "Sessão de áudio expirada. Atualize a página." });
  const source = JSON.stringify({ audio_url: mediaPath + assetId });
  const [asset] = await sql`SELECT audio.* FROM app_drive_audio audio
    JOIN app_users viewer ON viewer.id = ${viewer} AND viewer.status = 'ativo'
    WHERE audio.id = ${assetId} AND EXISTS (
      SELECT 1 FROM app_records reference
      JOIN app_records track ON track.entity = 'Track' AND track.id =
        CASE WHEN reference.entity = 'Track' THEN reference.id ELSE reference.data->>'track_id' END
      JOIN app_records project ON project.entity = 'Project' AND project.id = track.data->>'project_id'
      WHERE reference.entity IN ('Track', 'TrackVersion') AND reference.data @> ${source}::jsonb
    )`;
  if (!asset) return send(res, 404, { error: "Áudio não encontrado." });
  const token = await accessToken(sql, asset.user_id);
  if (!token) return send(res, 410, { error: "O proprietário precisa reconectar o Google Drive." });
  const range = req.headers.range;
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return send(res, 416, { error: "Intervalo inválido." });
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.once("close", abort);
  try {
    const upstream = await fetch(`${google}/drive/v3/files/${encodeURIComponent(asset.google_file_id)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}`, ...(range ? { Range: range } : {}) },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)]),
    });
    if (!upstream.ok || !upstream.body) return send(res, upstream.status === 416 ? 416 : 410, { error: "Áudio indisponível no Google Drive." });
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", asset.mime_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "sandbox");
    res.setHeader("Accept-Ranges", "bytes");
    for (const key of ["Content-Length", "Content-Range"]) {
      const value = upstream.headers.get(key);
      if (value) res.setHeader(key, value);
    }
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    if (!res.headersSent && !res.destroyed) return send(res, 502, { error: "Não foi possível ler o áudio no Drive." });
    if (!res.destroyed) res.destroy(error);
  } finally {
    res.off("close", abort);
  }
}

export async function handleDrive(req, res, sql, action, assetId) {
  res.setHeader("Cache-Control", "private, no-store");
  if (action === "session" && req.method === "DELETE") {
    if (!configured() || req.headers.origin !== appOrigin()) return send(res, 403, { error: "Origem inválida." });
    setCookie(res, mediaCookie, "", mediaPath, 0);
    return send(res, 200, { ok: true });
  }
  if (!configured()) return send(res, ["status", "session"].includes(action) ? 200 : 503, { enabled: false, connected: false, error: "Google Drive ainda não configurado." });
  if (action === "session" && req.method === "POST") {
    const actor = await currentUser(req, sql);
    if (actor?.status !== "ativo") return send(res, 403, { error: "Acesso não autorizado." });
    refreshDriveMedia(res, actor);
    return send(res, 200, { ok: true });
  }
  await initialize(sql);
  if (action === "callback" && req.method === "GET") return connectCallback(req, res, sql);
  if (action === "audio" && req.method === "GET" && assetId) return streamAudio(req, res, sql, assetId);
  const actor = await currentUser(req, sql);
  if (actor?.status !== "ativo") return send(res, 403, { error: "Acesso não autorizado." });
  if (action === "status" && req.method === "GET") {
    const [row] = await sql`SELECT user_id FROM app_drive_connections WHERE user_id = ${actor.id}`;
    return send(res, 200, { enabled: true, connected: !!row });
  }
  if (action === "connect" && req.method === "POST") {
    const state = jwt.sign({ purpose: "drive-oauth", actor: actor.id, nonce: crypto.randomUUID() }, jwtSecret(), { expiresIn: "10m" });
    setCookie(res, oauthCookie, state, "/api/drive/callback", 600);
    const query = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callbackUrl(), response_type: "code",
      scope, access_type: "offline", prompt: "consent select_account", state,
    });
    return send(res, 200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${query}` });
  }
  if (!["start", "finish"].includes(action) || req.method !== "POST") return send(res, 404, { error: "Rota não encontrada." });
  const body = await readJson(req);
  const token = await accessToken(sql, actor.id);
  if (!token) return send(res, 409, { error: "Reconecte seu Google Drive para enviar o áudio." });
  const headers = { Authorization: `Bearer ${token}` };
  if (action === "start") {
    const { name, size, type } = body;
    if (typeof name !== "string" || !name.trim() || !Number.isSafeInteger(size) || size < 1 ||
      typeof type !== "string" || !/^audio\/[a-z0-9.+-]+$/i.test(type)) return send(res, 400, { error: "Selecione um arquivo de áudio válido." });
    const asset = id("drive");
    const response = await fetch(google + "/upload/drive/v3/files?uploadType=resumable&fields=id", {
      method: "POST",
      headers: { ...headers, Origin: appOrigin(), "Content-Type": "application/json", "X-Upload-Content-Type": type, "X-Upload-Content-Length": String(size) },
      body: JSON.stringify({ name: name.slice(0, 230), mimeType: type, appProperties: { dz6Asset: asset } }),
      signal: AbortSignal.timeout(15000),
    });
    const url = response.headers.get("Location");
    if (!response.ok || !url || new URL(url).origin !== google) return send(res, 502, { error: "O Drive não iniciou o envio. Confira o espaço disponível e tente novamente." });
    return send(res, 200, { url, asset });
  }
  if (typeof body.fileId !== "string" || !/^[\w-]+$/.test(body.fileId) ||
    typeof body.asset !== "string" || !/^drive_[a-f0-9-]{36}$/.test(body.asset)) return send(res, 400, { error: "Envio inválido." });
  const file = await fetch(`${google}/drive/v3/files/${body.fileId}?fields=id,mimeType,size,trashed,appProperties,ownedByMe`, {
    headers, signal: AbortSignal.timeout(15000),
  }).then(response => response.json());
  if (file.id !== body.fileId || !file.ownedByMe || file.trashed || file.appProperties?.dz6Asset !== body.asset ||
    !/^audio\/[a-z0-9.+-]+$/i.test(file.mimeType || "") || Number(file.size) <= 0) return send(res, 400, { error: "O Drive não confirmou o arquivo de áudio." });
  const rows = await sql`INSERT INTO app_drive_audio (id, user_id, google_file_id, mime_type)
    VALUES (${body.asset}, ${actor.id}, ${file.id}, ${file.mimeType})
    ON CONFLICT (id) DO UPDATE SET mime_type = EXCLUDED.mime_type
    WHERE app_drive_audio.user_id = EXCLUDED.user_id AND app_drive_audio.google_file_id = EXCLUDED.google_file_id
    RETURNING id`;
  if (!rows.length) return send(res, 409, { error: "Esse envio não corresponde ao áudio original." });
  return send(res, 200, { file_url: mediaPath + body.asset });
}
