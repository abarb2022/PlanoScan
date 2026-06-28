export type UserRole = "REP" | "MANAGER" | "ADMIN";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  role: UserRole;
}

export interface AuthSession {
  token: string;
}

export interface AuthUser {
  email: string;
  role?: UserRole;
}
