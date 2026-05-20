# Deploy na Vercel

## 1. Banco (Turso) — obrigatório

SQLite em arquivo (`file:./dev.db`) **não funciona** na Vercel. Use [Turso](https://turso.tech) (grátis):

```bash
# Instale o CLI: https://docs.turso.tech/cli
turso auth login
turso db create whale-app
turso db show whale-app --url
turso db tokens create whale-app
```

Anote:
- `DATABASE_URL` → `libsql://...`
- `TURSO_AUTH_TOKEN` → token gerado

Aplique as migrations no Turso:

```bash
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma migrate deploy
```

## 2. Importar no Vercel

1. [vercel.com/new](https://vercel.com/new) → importe `DiegoMiuraDev/Whale-APP`
2. Framework: **Next.js** (detectado automaticamente)
3. Adicione as variáveis de ambiente:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URL `libsql://` do Turso |
| `TURSO_AUTH_TOKEN` | Token do Turso |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://SEU-DOMINIO.vercel.app/api/auth` |
| `NEXTAUTH_URL` | igual a `AUTH_URL` |
| `SPOTIFY_CLIENT_ID` | Spotify Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify Dashboard |
| `AUDD_API_TOKEN` | audd.io |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `CRON_SECRET` | string aleatória longa |

Não defina `NGROK_URL` em produção.

## 3. Spotify Dashboard

Em **Redirect URIs**, adicione (troque pelo seu domínio Vercel):

```text
https://whale-app.vercel.app/api/auth/callback/spotify
```

## 4. Cron de playlists

O `vercel.json` agenda `/api/cron/expire-playlists` **1x por dia** (03:00 UTC) — limite do plano **Hobby** da Vercel (cron mais frequente que diário exige Pro).

Defina `CRON_SECRET` no painel da Vercel — ela envia `Authorization: Bearer <CRON_SECRET>` automaticamente.

## 5. Deploy via CLI (opcional)

```bash
npx vercel link
npx vercel env pull .env.vercel.local
npx vercel --prod
```

## Troubleshooting

| Erro | Solução |
|------|---------|
| `redirect_uri mismatch` | URI exata no Spotify = `AUTH_URL/callback/spotify` |
| Prisma / DB na build | Confirme `DATABASE_URL` + `TURSO_AUTH_TOKEN` e rode migrate no Turso |
| Login não redireciona | `AUTH_URL` deve ser HTTPS do domínio Vercel, sem barra no final do host |
