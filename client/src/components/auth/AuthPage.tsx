import type { LoginPayload } from "../../types/auth";
import { AuthForm } from "./AuthForm";
import "./auth.css";

interface Props {
  onLogin: (payload: LoginPayload) => Promise<void>;
  error: string | null;
  isSubmitting: boolean;
}

export function AuthPage({ onLogin, error, isSubmitting }: Props) {
  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-hidden="true">
        <div className="auth-brand">
          <span className="auth-logo-mark" />
          <span className="auth-logo-text">PlanoScan</span>
        </div>

        <div className="auth-showcase-body">
          <span className="auth-badge">
            <span className="auth-badge-dot" />
            AI-powered compliance scoring
          </span>

          <h1>Planogram compliance, verified automatically.</h1>

          <p>
            Replace manual shelf-photo reviews with a consistent, auditable
            scoring pipeline — brand accuracy, quantity, position, and shelf
            fullness, evaluated on every visit.
          </p>
        </div>

        <p className="auth-showcase-footer">
          © {new Date().getFullYear()} PlanoScan. Field intelligence for
          retail teams.
        </p>
      </section>

      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-form-inner">
          <h1 id="auth-title">Welcome</h1>
          <p className="auth-subtitle">
            Sign in to review submissions, manage planograms, or log a store
            visit.
          </p>

          {error ? <div className="alert">{error}</div> : null}

          <AuthForm isSubmitting={isSubmitting} onLogin={onLogin} />

          <p className="auth-signup-hint">
            Not on PlanoScan yet?{" "}
            <span className="auth-signup-hint-accent">
              Ask your admin for access
            </span>
          </p>

          <div className="auth-form-divider" />

          <p className="auth-role-note">
            Access is role-based — Sales Rep, Manager, and Admin views are
            assigned automatically at sign-in.
          </p>
        </div>
      </section>
    </main>
  );
}
