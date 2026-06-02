import { mapApiErrorMessage, mapAuthResponse } from "../mappers/authMapper";
import type { ApiAuthResponse, ApiErrorResponse } from "../types/api";
import type { AuthSession, LoginPayload, RegisterPayload } from "../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

const AUTH_TOKEN_KEY = "planoscan_auth_token";

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const data = hasJsonBody ? await response.json() : null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;
    const message = mapApiErrorMessage(errorData, response.status);

    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await request<ApiAuthResponse>("/planoscan/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return mapAuthResponse(response);
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const response = await request<ApiAuthResponse>("/planoscan/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return mapAuthResponse(response);
  },

  saveToken(token: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },
};

export { ApiError };
