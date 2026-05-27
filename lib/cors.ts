/** Zet een waarde om naar browser-origin (scheme + host + poort), zonder pad. */
export function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed).origin;
    }
  } catch {
    return null;
  }
  return null;
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? '';
  const origins = new Set<string>();
  for (const part of raw.split(',')) {
    const normalized = normalizeOrigin(part);
    if (normalized) origins.add(normalized);
  }
  return [...origins];
}

export function isOriginAllowed(origin: string | undefined): boolean {
  const allowed = getAllowedOrigins();
  if (!allowed.length) return true;
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  return normalized !== null && allowed.includes(normalized);
}

export function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = getAllowedOrigins();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Chat-Api-Key',
  };

  if (!allowed.length) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }

  const normalized = origin ? normalizeOrigin(origin) : null;
  if (normalized && allowed.includes(normalized)) {
    headers['Access-Control-Allow-Origin'] = normalized;
    headers['Vary'] = 'Origin';
  }

  return headers;
}
