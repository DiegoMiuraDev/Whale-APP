# Desenvolvimento com ngrok (HTTPS)

O Spotify exige **HTTPS** no Redirect URI (exceto `http://localhost` em alguns casos). O ngrok cria um túnel HTTPS para o seu `localhost:3000`.

## 1. Instalar ngrok

```bash
# Linux (snap)
sudo snap install ngrok

# ou baixe em https://ngrok.com/download
```

Crie conta em [ngrok.com](https://ngrok.com), copie o authtoken e configure:

```bash
ngrok config add-authtoken SEU_TOKEN
```

## 2. Subir o app e o túnel

**Terminal 1** — Next.js:

```bash
npm run dev
```

**Terminal 2** — ngrok:

```bash
ngrok http 3000
```

Copie a URL **HTTPS** que aparece, por exemplo:

```text
https://a1b2c3d4.ngrok-free.app
```

## 3. Atualizar o `.env`

Substitua `SUA_URL` pela URL do ngrok (sem barra no final):

```env
NGROK_URL="https://SUA_URL.ngrok-free.app"
AUTH_URL="https://SUA_URL.ngrok-free.app/api/auth"
NEXTAUTH_URL="https://SUA_URL.ngrok-free.app/api/auth"
```

Reinicie o servidor (`Ctrl+C` e `npm run dev`).

## 4. Spotify Dashboard

Settings → **Redirect URIs** → adicione:

```text
https://SUA_URL.ngrok-free.app/api/auth/callback/spotify
```

Salve e aguarde ~30 segundos.

## 5. Usar o app

Abra no navegador a URL do **ngrok** (não localhost):

```text
https://SUA_URL.ngrok-free.app
```

Faça login em `/login`.

## Observações

- A URL do ngrok **muda** a cada execução (plano gratuito) — atualize `.env` e Spotify de novo.
- Plano pago permite domínio fixo.
- Na primeira visita o ngrok pode mostrar uma página de aviso — clique em **Visit Site**.
- Microfone (identificar música) pode exigir HTTPS — ngrok ajuda nisso também.
