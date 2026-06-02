import { AuthForm } from "./AuthForm";
import { useAuth } from "../hooks/useAuth";

export function AuthPage() {
  const { error, isSubmitting, login, logout, user } = useAuth();

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="brand-block">
          <p className="eyebrow">PlanoScan</p>
          <h1 id="auth-title">
            {user ? "Account access is active" : "Sign in to continue"}
          </h1>
          <p>
            Access planogram review tools with the role assigned to your
            account.
          </p>
        </div>

        {user ? (
          <SessionCard email={user.email} role={user.role} onLogout={logout} />
        ) : (
          <LoginPanel
            error={error}
            isSubmitting={isSubmitting}
            onLogin={login}
          />
        )}
      </section>
    </main>
  );
}

interface SessionCardProps {
  email: string;
  role?: string;
  onLogout: () => void;
}

function SessionCard({ email, role, onLogout }: SessionCardProps) {
  return (
    <div className="session-card">
      <div>
        <span className="session-label">Signed in as</span>
        <strong>{email}</strong>
        {role ? <small>{role}</small> : null}
      </div>
      <button className="secondary-button" onClick={onLogout} type="button">
        Sign out
      </button>
    </div>
  );
}

interface LoginPanelProps {
  error: string | null;
  isSubmitting: boolean;
  onLogin: Parameters<typeof AuthForm>[0]["onLogin"];
}

function LoginPanel({ error, isSubmitting, onLogin }: LoginPanelProps) {
  return (
    <>
      { }

      {error ? <div className="alert">{error}</div> : null}

      <AuthForm
        isSubmitting={isSubmitting}
        onLogin={onLogin}
        /* onRegister={handleRegister} */
      />
    </>
  );
}
