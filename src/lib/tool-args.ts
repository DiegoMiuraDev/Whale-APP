export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return asStringArray(parsed);
      } catch {
        return [trimmed];
      }
    }
    return trimmed.split(/[,;|\n]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function pickArg(
  args: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (args[key] !== undefined && args[key] !== null) return args[key];
  }
  return undefined;
}

export function pickNumber(
  args: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  const raw = pickArg(args, ...keys);
  if (raw === undefined) return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
