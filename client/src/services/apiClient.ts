const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8081";

const AUTH_TOKEN_KEY = "planoscan_auth_token";

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

function buildHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!response.ok) {
    const fallbackError: ApiErrorResponse = {
      code: "REQUEST_FAILED",
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };

    try {
      const error = (await response.json()) as ApiErrorResponse;
      throw new ApiError(error);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(fallbackError);
    }
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
