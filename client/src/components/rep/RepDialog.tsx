import { FormEvent, useEffect, useState } from "react";
import type { Rep, RepRequest } from "../../types/rep";
import "../store/StoreDialog.css";
import "./RepDialog.css";

interface Props {
  open: boolean;
  editingRep: Rep | null;
  onClose: () => void;
  onSubmit: (req: RepRequest) => Promise<void>;
}

const empty = { name: "", email: "" };

export default function RepDialog({ open, editingRep, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setForm(editingRep ? { name: editingRep.name, email: editingRep.email } : empty);
    }
  }, [open, editingRep]);

  function set(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ name: form.name.trim(), email: form.email.trim() });
      onClose();
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (editingRep ? "Failed to update rep." : "Failed to create rep."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">{editingRep ? "Edit Rep" : "Add Rep"}</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!editingRep && (
          <p className="rep-dialog-hint">
            A temporary password will be generated and logged to the server console.
            The rep must change it on first login.
          </p>
        )}

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Full Name</label>
            <input
              className="dialog-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ana Barbakadze"
              required
              autoFocus
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Email</label>
            <input
              className="dialog-input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="rep@company.com"
              required
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : editingRep ? "Save Changes" : "Create Rep"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
