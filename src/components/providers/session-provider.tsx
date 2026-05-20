"use client";

import { SessionProvider } from "next-auth/react";
import { APP_URL } from "@/lib/auth.config";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth" baseUrl={APP_URL}>
      {children}
    </SessionProvider>
  );
}
