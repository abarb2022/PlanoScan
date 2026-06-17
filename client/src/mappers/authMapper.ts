import type { AuthSession } from "../types/auth";

export function mapAuthResponse(response: { token: string }): AuthSession {
  return { token: response.token };
}

export function mapApiErrorMessage(
  response: { message?: string } | null,
  status: number,
): string {
  return response?.message ?? `Request failed with status ${status}`;
}
