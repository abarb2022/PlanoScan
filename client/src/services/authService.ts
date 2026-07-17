import { mapApiErrorMessage, mapAuthResponse } from "../mappers/authMapper";
import type { AuthSession, LoginPayload, RegisterPayload } from "../types/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:8082";

const AUTH_TOKEN_KEY = "planoscan_auth_token";
const MUST_CHANGE_KEY = "planoscan_must_change_password";

export class ApiError extends Error {
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
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = mapApiErrorMessage(data, response.status);
    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await request<{ token: string; mustChangePassword: boolean }>(
      "/planoscan/auth/login",
      { method: "POST", body: JSON.stringify(payload) },
    );
    return { token: response.token, mustChangePassword: response.mustChangePassword ?? false };
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const response = await request<{ token: string; mustChangePassword: boolean }>(
      "/planoscan/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
    );
    return { token: response.token, mustChangePassword: response.mustChangePassword ?? false };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    await request<void>("/planoscan/auth/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
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

  saveMustChangePassword(value: boolean) {
    localStorage.setItem(MUST_CHANGE_KEY, String(value));
  },

  getMustChangePassword(): boolean {
    return localStorage.getItem(MUST_CHANGE_KEY) === "true";
  },

  clearMustChangePassword() {
    localStorage.removeItem(MUST_CHANGE_KEY);
  },
};
