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
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="brand-block">
          <p className="eyebrow">PlanoScan</p>
          <h1 id="auth-title">Sign in to continue</h1>
          <p>
            Access planogram review tools with the role assigned to your
            account.
          </p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <AuthForm isSubmitting={isSubmitting} onLogin={onLogin} />
      </section>
    </main>
  );
}
