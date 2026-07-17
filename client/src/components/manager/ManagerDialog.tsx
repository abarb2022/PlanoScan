import { FormEvent, useEffect, useState } from "react";
import { getCompanies } from "../../services/companyService";
import type { Company, Manager, ManagerRequest } from "../../types/manager";
import "../store/StoreDialog.css";

interface Props {
  open: boolean;
  editingManager: Manager | null;
  onClose: () => void;
  onSubmit: (req: ManagerRequest) => Promise<void>;
}

const empty = { name: "", surname: "", email: "", phone: "", companyId: "" };

export default function ManagerDialog({ open, editingManager, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(empty);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCompanies().then(setCompanies).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      setForm(
        editingManager
          ? {
              name: editingManager.name,
              surname: editingManager.surname ?? "",
              email: editingManager.email,
              phone: editingManager.phone ?? "",
              companyId: editingManager.companyId,
            }
          : empty,
      );
    }
  }, [open, editingManager]);

  function set(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        surname: form.surname.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        companyId: form.companyId,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (editingManager ? "Failed to update manager." : "Failed to create manager."),
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
          <h2 className="dialog-title">{editingManager ? "Edit Manager" : "Add Manager"}</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!editingManager && (
          <p className="rep-dialog-hint">
            A temporary password will be generated and logged to the server console.
            The manager must change it on first login.
          </p>
        )}

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">First Name</label>
            <input
              className="dialog-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ana"
              required
              autoFocus
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Surname</label>
            <input
              className="dialog-input"
              value={form.surname}
              onChange={(e) => set("surname", e.target.value)}
              placeholder="e.g. Barbakadze"
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Email</label>
            <input
              className="dialog-input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="manager@company.com"
              required
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Phone</label>
            <input
              className="dialog-input"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. +995 555 123456"
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Company</label>
            <select
              className="dialog-input"
              value={form.companyId}
              onChange={(e) => set("companyId", e.target.value)}
              required
            >
              <option value="">Select a company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : editingManager ? "Save Changes" : "Create Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
