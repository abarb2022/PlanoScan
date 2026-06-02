import { FormEvent, useState } from "react";
import type { LoginPayload, RegisterPayload, UserRole } from "../types/auth";

interface AuthFormProps {
  isSubmitting: boolean;
  onLogin: (payload: LoginPayload) => Promise<void>;
  onRegister?: (payload: RegisterPayload) => Promise<void>;
}

/*
const roles: Array<{ value: UserRole; label: string }> = [
  { value: "REP", label: "Representative" },
  { value: "EVALUATOR", label: "Evaluator" },
  { value: "ADMIN", label: "Admin" },
];
*/

export function AuthForm({ isSubmitting, onLogin }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [role, setRole] = useState<UserRole>("REP");
  // const isRegistering = mode === "register";
  // const submitLabel = isRegistering ? "Create account" : "Sign in";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      email: email.trim(),
      password,
    };

    /*
    if (isRegistering) {
      await onRegister({ ...payload, role });
      return;
    }
    */

    await onLogin(payload);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
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
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
          type="password"
          value={password}
        />
      </label>

      {/*
      {isRegistering ? (
        <label className="field">
          <span>Role</span>
          <select
            name="role"
            onChange={(event) => setRole(event.target.value as UserRole)}
            value={role}
          >
            {roles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      */}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : "Sign in"}
      </button>
    </form>
  );
}
