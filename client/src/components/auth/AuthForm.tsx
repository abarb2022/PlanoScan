import { FormEvent, useState } from "react";
import type { LoginPayload } from "../../types/auth";

interface Props {
  isSubmitting: boolean;
  onLogin: (payload: LoginPayload) => Promise<void>;
}

export function AuthForm({ isSubmitting, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin({ email: email.trim(), password });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          minLength={6}
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          type="password"
          value={password}
        />
      </label>

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : "Sign in"}
      </button>
    </form>
  );
}
