import { FormEvent, useEffect, useState } from "react";
import type { Company } from "../../types/manager";
import "../store/StoreDialog.css";

interface Props {
  open: boolean;
  editingCompany: Company | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CompanyDialog({ open, editingCompany, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setName(editingCompany ? editingCompany.name : "");
    }
  }, [open, editingCompany]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (editingCompany ? "Failed to update company." : "Failed to create company."),
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
          <h2 className="dialog-title">{editingCompany ? "Edit Company" : "New Company"}</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Company Name</label>
            <input
              className="dialog-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
              autoFocus
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : editingCompany ? "Save Changes" : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
