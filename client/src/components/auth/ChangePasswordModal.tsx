import { FormEvent, useState } from "react";
import "./ChangePasswordModal.css";

interface Props {
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => void;
}

export default function ChangePasswordModal({ onSave, onLogout }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(currentPassword, newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(message || "Failed to change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cp-overlay">
      <div className="cp-card">
        <div className="cp-icon">🔒</div>
        <h2 className="cp-title">Set Your Password</h2>
        <p className="cp-subtitle">
          Your account was created with a temporary password. Please set a new
          password to continue.
        </p>

        {error && <p className="cp-error">{error}</p>}

        <form className="cp-form" onSubmit={handleSubmit}>
          <div className="cp-field">
            <label className="cp-label">Temporary Password</label>
            <input
              className="cp-input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter the temporary password"
              required
              autoFocus
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">New Password</label>
            <input
              className="cp-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">Confirm New Password</label>
            <input
              className="cp-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          <button
            type="submit"
            className="cp-btn-primary"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Set Password & Continue"}
          </button>
        </form>

        <button className="cp-btn-logout" onClick={onLogout} type="button">
          Sign out
        </button>
      </div>
    </div>
  );
}
