import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export function id(prefix = "rec") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res) {
  send(res, 405, { error: "Method not allowed" });
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    permissao: row.permissao,
    full_name: row.full_name,
    cargo: row.cargo || [],
    handle: row.handle,
    status: row.status,
    photo_url: row.photo_url,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export function record(row) {
  if (!row) return null;
  return {
    id: row.id,
    ...(row.data || {}),
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export function jwtSecret() {
  return process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.DATABASE_URL;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: "30d" });
}

export function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function currentUser(req, sql) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret());
    const rows = await sql`SELECT * FROM app_users WHERE id = ${payload.sub} LIMIT 1`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export function sortRows(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return desc ? 1 : -1;
    if (bv == null) return desc ? -1 : 1;
    return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });
}

export function normalizePatch(patch) {
  if (patch && typeof patch === "object" && patch.$set) return patch.$set;
  return patch || {};
}
