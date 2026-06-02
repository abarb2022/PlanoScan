export interface ApiAuthResponse {
  token: string;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  status?: number;
}
