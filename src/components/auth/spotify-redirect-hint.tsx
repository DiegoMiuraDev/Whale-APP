import { APP_URL, IS_NGROK, SPOTIFY_REDIRECT_URI } from "@/lib/auth.config";

export function SpotifyRedirectHint() {
  return (
    <div className="rounded-lg bg-whale-elevated p-4 text-left text-xs text-whale-muted">
      <p className="mb-2 font-semibold text-white">
        Redirect URI no Spotify Dashboard
      </p>
      <p className="mb-2">
        <a
          href="https://developer.spotify.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-whale-accent underline"
        >
          Spotify Dashboard
        </a>{" "}
        → Settings → Redirect URIs → adicione <strong>exatamente</strong>:
      </p>
      <code className="block break-all rounded bg-black/40 px-2 py-2 text-whale-accent">
        {SPOTIFY_REDIRECT_URI}
      </code>
      {IS_NGROK ? (
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Abra o app pela URL do ngrok:{" "}
            <a href={APP_URL} className="text-whale-accent underline">
              {APP_URL}
            </a>
          </li>
          <li>Spotify exige HTTPS — ngrok resolve isso</li>
          <li>Se mudar o link do ngrok, atualize o .env e o Dashboard</li>
        </ul>
      ) : (
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Spotify pode recusar HTTP — use ngrok (veja NGROK.md)
          </li>
          <li>Localhost aceita: http://localhost:3000/api/auth/callback/spotify</li>
          <li>
            Acesse:{" "}
            <a href={APP_URL} className="text-whale-accent underline">
              {APP_URL}
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
