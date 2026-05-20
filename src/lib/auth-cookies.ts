export function useSecureAuthCookies(): boolean {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NGROK_URL ??
    process.env.APP_URL ??
    "";
  return url.startsWith("https://") || process.env.NODE_ENV === "production";
}
