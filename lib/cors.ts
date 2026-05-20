export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
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
  if (origin && allowed.some(a => origin === a || origin.startsWith(a))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}
