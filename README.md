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
APP_URL="http://localhost:5173"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
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
5. Para login com Google, configure `APP_URL`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
6. Faça deploy.

No Google Cloud, crie um cliente OAuth do tipo **Aplicativo da Web**. Em producao, use:

```text
Origem JavaScript autorizada: https://seu-dominio.vercel.app
URI de redirecionamento autorizada: https://seu-dominio.vercel.app/api/auth/google/callback
```

O valor de `APP_URL` deve ser exatamente a origem do site, sem barra no final. Por exemplo: `https://dz6rec.vercel.app`.

A API cria as tabelas `app_users` e `app_records` automaticamente no primeiro request. O primeiro cadastro feito no site vira `admin`/`superadmin`.

## Áudio no Google Drive pessoal

1. Ative a Google Drive API no projeto do cliente OAuth usado pela DZ6. Na tela de consentimento, conceda acesso aos usuários que vão testar a integração.
2. Adicione `https://seu-dominio.vercel.app/api/drive/callback` aos URIs autorizados do cliente OAuth Web e mantenha `APP_URL` apontando para esse domínio.
3. Configure `GOOGLE_DRIVE_TOKEN_KEY` no ambiente da aplicação com 32 bytes aleatórios em Base64. Gere a chave com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` e guarde-a junto dos demais segredos do projeto. Alterar a chave exige reconectar as contas.
4. Em **Adicionar faixa** ou **Gerenciar versões**, escolha um arquivo de áudio e selecione **Salvar no meu Drive**. Conecte sua conta Google quando solicitado.

O áudio fica privado no Drive de quem enviou. A DZ6 guarda a referência e usa a mesma política de acesso do catálogo interno para reprodução. A exclusão na DZ6 remove o vínculo do catálogo. Gerencie o arquivo original e a revogação do acesso pelo Google Drive e pela Conta Google.

## Scripts

- `npm run dev`: servidor Vite
- `npm run build`: build de producao
- `npm run preview`: preview do build
- `npm run lint`: ESLint
- `npm run typecheck`: checagem via `jsconfig.json`
