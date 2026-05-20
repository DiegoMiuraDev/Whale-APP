import { Sidebar } from "@/components/layout/sidebar";
import { PlayerBar } from "@/components/layout/player-bar";
import { PlayerProvider } from "@/context/player-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex h-screen overflow-hidden bg-whale-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-6 pb-4">{children}</main>
          <PlayerBar />
        </div>
      </div>
    </PlayerProvider>
  );
}
