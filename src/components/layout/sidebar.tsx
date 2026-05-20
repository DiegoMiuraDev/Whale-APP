"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Bot,
  ListMusic,
  Home,
  LogOut,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/discover", label: "Descobrir", icon: Compass },
  { href: "/agent", label: "Agente", icon: Bot },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-2 bg-whale-sidebar p-4">
      <Link href="/discover" className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-whale-accent">
          <Radio className="h-5 w-5 text-black" />
        </div>
        <span className="text-lg font-bold tracking-tight">Whale</span>
      </Link>

      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/"
            ? "bg-whale-elevated text-white"
            : "text-whale-muted hover:bg-whale-elevated hover:text-white",
        )}
      >
        <Home className="h-5 w-5" />
        Início
      </Link>

      <nav className="flex flex-col gap-1">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-whale-muted">
          Biblioteca
        </p>
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-whale-elevated text-white"
                : "text-whale-muted hover:bg-whale-elevated hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-whale-muted transition-colors hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
