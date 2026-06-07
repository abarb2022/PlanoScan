import type { AuthUser, UserRole } from "../types/auth";

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: UserRole | string;
  exp?: number;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  const email = payload.email ?? payload.sub;
  if (!email) return null;

  return { email, role: payload.role as UserRole | undefined };
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
