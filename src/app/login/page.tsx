import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/discover";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-whale-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-whale-accent">
            <Radio className="h-7 w-7 text-black" />
          </div>
          <CardTitle className="text-2xl">Entrar no Whale</CardTitle>
          <p className="text-sm text-whale-muted">
            Conecte sua conta Spotify para buscar, identificar e criar
            playlists
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server";
              await signIn("spotify", { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Continuar com Spotify
            </Button>
          </form>
          {params.error && (
            <p className="text-center text-sm text-red-400">
              {params.error === "Configuration"
                ? "Não foi possível conectar agora. Tente de novo em instantes."
                : params.error === "AccessDenied"
                  ? "Acesso negado — você cancelou ou não autorizou o Whale."
                  : "Algo deu errado. Tente novamente."}
            </p>
          )}
          <Link
            href="/"
            className="text-center text-sm text-whale-muted hover:text-white"
          >
            Voltar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
