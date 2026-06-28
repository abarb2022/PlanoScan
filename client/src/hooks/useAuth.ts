import { useEffect, useState } from "react";
import { ApiError, authService } from "../services/authService";
import type { AuthUser, LoginPayload } from "../types/auth";
import { getUserFromToken, isTokenExpired } from "../utils/jwt";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    if (!token || isTokenExpired(token)) {
      authService.clearToken();
      authService.clearMustChangePassword();
      return;
    }
    setUser(getUserFromToken(token));
    setMustChangePassword(authService.getMustChangePassword());
  }, []);

  async function login(payload: LoginPayload): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await authService.login(payload);
      authService.saveToken(response.token);
      authService.saveMustChangePassword(response.mustChangePassword);
      setUser(getUserFromToken(response.token));
      setMustChangePassword(response.mustChangePassword);
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

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await authService.changePassword(currentPassword, newPassword);
    authService.clearMustChangePassword();
    setMustChangePassword(false);
  }

  function logout() {
    authService.clearToken();
    authService.clearMustChangePassword();
    setUser(null);
    setMustChangePassword(false);
  }

  return { error, isSubmitting, login, logout, changePassword, mustChangePassword, user };
}
