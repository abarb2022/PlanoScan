import { useEffect, useState } from "react";
import { ApiError, authService } from "../services/authService";
import type { AuthUser, LoginPayload } from "../types/auth";
import { getUserFromToken, isTokenExpired } from "../utils/jwt";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = authService.getToken();

    if (!token || isTokenExpired(token)) {
      authService.clearToken();
      return;
    }

    setUser(getUserFromToken(token));
  }, []);

  async function login(payload: LoginPayload): Promise<void> {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.login(payload);
      authService.saveToken(response.token);
      setUser(getUserFromToken(response.token));
    } catch (currentError) {
      if (currentError instanceof ApiError) {
        setError(currentError.message);
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function logout() {
    authService.clearToken();
    setUser(null);
  }

  return {
    error,
    isSubmitting,
    login,
    logout,
    setError,
    user,
  };
}
