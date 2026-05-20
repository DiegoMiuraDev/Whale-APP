import Link from "next/link";
import {
  Bot,
  Mic,
  ListMusic,
  Clock,
  ArrowRight,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Mic,
    title: "Ouça e identifique",
    desc: "Como um Shazam embutido — grave alguns segundos e descubra a faixa.",
  },
  {
    icon: Bot,
    title: "Agente DJ",
    desc: "Peça playlists em linguagem natural; o agente monta na sua conta Spotify.",
  },
  {
    icon: ListMusic,
    title: "Busca por letra",
    desc: "Cole um trecho e busque no catálogo Spotify conectado.",
  },
  {
    icon: Clock,
    title: "Playlists temporárias",
    desc: "Festas, treinos, eventos — playlists que expiram sozinhas.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-whale-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-whale-accent">
            <Radio className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold">Whale</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/login">
              Conectar Spotify
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-whale-accent">
          Music companion — não um substituto do Spotify
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Superpoderes de descoberta para quem já usa Spotify
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-whale-muted">
          Whale identifica músicas, busca por letra e monta playlists —
          inclusive temporárias — na sua conta. Playback completo requer
          Spotify Premium; caso contrário, abrimos no app oficial.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/login">Começar grátis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Ver recursos</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-2 h-8 w-8 text-whale-accent" />
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-whale-muted">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Pitch em 60 segundos</h2>
        <ol className="mt-6 space-y-3 text-left text-whale-muted">
          <li>1. Usuário conecta Spotify em um clique.</li>
          <li>2. No bar, toca uma música — Whale identifica em ~5s.</li>
          <li>3. Usuário pede: &quot;playlist temporária de 2h com vibes similares&quot;.</li>
          <li>4. Agente cria na conta; playlist some após o evento.</li>
        </ol>
        <p className="mt-8 text-xs text-whale-muted">
          Modelo: freemium (identificações limitadas) + Pro (agente ilimitado +
          temporárias) + B2B eventos.
        </p>
      </section>

      <footer className="border-t border-whale-border py-8 text-center text-sm text-whale-muted">
        Whale © {new Date().getFullYear()} — UI inspirada em players modernos;
        marca e catálogo próprios.
      </footer>
    </div>
  );
}
