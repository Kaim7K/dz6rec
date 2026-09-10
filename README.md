# DZ6 Rec

Aplicacao React/Vite pronta para deploy na Vercel, com API serverless e persistencia em Postgres.

## Requisitos

- Node.js 20+
- Uma base Postgres acessivel por `DATABASE_URL` (Neon via Vercel Marketplace e recomendado)
- Opcional: Vercel Blob com `BLOB_READ_WRITE_TOKEN` para uploads de arquivos

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e configure:

```bash
DATABASE_URL="postgres://user:password@host/database?sslmode=require"
JWT_SECRET="use-um-segredo-longo-e-aleatorio"
BLOB_READ_WRITE_TOKEN=""
```

Sem `BLOB_READ_WRITE_TOKEN`, uploads pequenos ainda funcionam como data URL. Para capas e audios reais em producao, configure Vercel Blob.

## Rodar localmente

```bash
npm install
npm run dev
```

Para testar as serverless functions localmente com o mesmo comportamento da Vercel:

```bash
npm install -g vercel
vercel dev
```

## Deploy na Vercel

1. Crie ou vincule o projeto na Vercel.
2. Adicione um banco Neon Postgres pelo Marketplace da Vercel, ou configure `DATABASE_URL` manualmente.
3. Configure `JWT_SECRET`.
4. Opcionalmente adicione Vercel Blob e configure `BLOB_READ_WRITE_TOKEN`.
5. Faça deploy.

A API cria as tabelas `app_users` e `app_records` automaticamente no primeiro request. O primeiro cadastro feito no site vira `admin`/`superadmin`.

## Scripts

- `npm run dev`: servidor Vite
- `npm run build`: build de producao
- `npm run preview`: preview do build
- `npm run lint`: ESLint
- `npm run typecheck`: checagem via `jsconfig.json`
