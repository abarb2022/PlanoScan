import type { ApiAuthResponse, ApiErrorResponse } from "../types/api";
import type { AuthSession } from "../types/auth";

export function mapAuthResponse(response: ApiAuthResponse): AuthSession {
  return {
    token: response.token,
  };
}

export function mapApiErrorMessage(
  response: ApiErrorResponse | null,
  status: number,
) {
  return response?.message ?? `Request failed with status ${status}`;
}
