# Whale — Music companion com agente

Web app que se conecta à sua conta **Spotify** para descobrir músicas (áudio ou letra), conversar com um agente DJ e criar **playlists temporárias**. Não hospeda catálogo próprio — playback completo requer Spotify Premium.

## Recursos

- Identificação de música por microfone (AudD ou mock local)
- Busca por trecho de letra no catálogo Spotify
- Agente **Google Gemini** com tools (busca, letra, criar playlist)
- Playlists temporárias com expiração automática (cron)

## Stack

- Next.js 16, TypeScript, Tailwind CSS v4
- Auth.js v5 + Spotify OAuth
- Prisma + SQLite (dev) — troque por Postgres em produção
- Google Gemini, AudD (opcionais; mocks sem chaves)

## Setup

```bash
cp .env.example .env.local
# Edite .env.local com suas chaves

npm install
npx prisma migrate dev
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis obrigatórias (mínimo)

| Variável | Onde obter |
|----------|------------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000/api/auth` |
| `SPOTIFY_CLIENT_ID` | [Spotify Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Spotify Dashboard |
| `DATABASE_URL` | `file:./dev.db` (já no exemplo) |

### Spotify + ngrok (HTTPS)

Se o Spotify não aceitar HTTP, use **ngrok**. Guia completo: [NGROK.md](./NGROK.md)

Resumo:

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

No `.env` (troque pela sua URL ngrok):

```env
NGROK_URL="https://xxxx.ngrok-free.app"
AUTH_URL="https://xxxx.ngrok-free.app/api/auth"
NEXTAUTH_URL="https://xxxx.ngrok-free.app/api/auth"
```

Redirect URI no Spotify Dashboard:

```text
https://xxxx.ngrok-free.app/api/auth/callback/spotify
```

Abra o app pela URL **https** do ngrok, não pelo localhost.

### Opcionais

| Variável | Serviço |
|----------|---------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Padrão: `gemini-2.0-flash` |
| `AUDD_API_TOKEN` | [audd.io](https://audd.io/) |
| `CRON_SECRET` | Proteção do endpoint de expiração |

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing / pitch |
| `/login` | OAuth Spotify |
| `/discover` | Busca no catálogo |
| `/agent` | Chat + mic + letra |
| `/playlists` | Temporárias ativas |
| `/api/cron/expire-playlists` | Cron (header `Authorization: Bearer CRON_SECRET`) |

## Deploy (Vercel)

1. Configure env vars no painel Vercel
2. Use Postgres (`DATABASE_URL`) e rode `prisma migrate deploy`
3. `vercel.json` agenda cron horário para expirar playlists

## Legal

- Marca **Whale** — não use logo/nome Spotify
- Música via API Spotify do usuário autenticado

Ver [PITCH.md](./PITCH.md) para roteiro de demonstração.
