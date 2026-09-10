# AGENTS.md

## Project Context

This is a user-owned React/Vite application prepared for Vercel. Keep changes focused, preserve existing UI conventions, and avoid committing secrets.

## Key Files

- `src/`: frontend application source.
- `src/api/appClient.js`: frontend API client.
- `api/`: Vercel serverless API for auth, uploads, and data persistence.
- `api/_db.js`: Postgres connection and table bootstrap.
- `vite.config.js`: Vite config.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm run dev` for frontend-only work.
- Use `vercel dev` when changes involve `/api` serverless functions.
- Data persists in Postgres through `DATABASE_URL`.
- File uploads use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.
- Run the relevant checks from `package.json` before finishing code changes.
