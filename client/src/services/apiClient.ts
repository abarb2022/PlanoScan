const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8082";

const AUTH_TOKEN_KEY = "planoscan_auth_token";

export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

export function resolveWebSocketUrl(path: string): string {
  return `${API_BASE_URL.replace(/^http/i, "ws")}${path}`;
}

type ApiErrorResponse = {
  code: string;
  message: string;
  status: number;
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(error: ApiErrorResponse) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.status = error.status;
  }
}

function buildHeaders(
  headers: HeadersInit | undefined,
  isFormData: boolean,
): Headers {
  const requestHeaders = new Headers(headers);
  if (!isFormData) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return requestHeaders;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, isFormData),
  });

  if (!response.ok) {
    const fallbackError: ApiErrorResponse = {
      code: "REQUEST_FAILED",
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };

    let errorBody: ApiErrorResponse;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      throw new ApiError(fallbackError);
    }
    throw new ApiError(errorBody);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await (response.json() as Promise<T>);
}
