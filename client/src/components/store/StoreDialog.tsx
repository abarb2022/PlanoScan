import { FormEvent, useEffect, useState } from "react";
import type { Store, StoreRequest } from "../../types/store";
import { dismissOnBackdropClick } from "../../utils/dom";
import "./StoreDialog.css";

interface StoreForm {
  name: string;
  address: string;
}

interface Props {
  open: boolean;
  editingStore: Store | null;
  onClose: () => void;
  onSubmit: (req: StoreRequest) => Promise<void>;
}

const emptyForm: StoreForm = { name: "", address: "" };

function toRequest(form: StoreForm): StoreRequest {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
  };
}

export default function StoreDialog({
  open,
  editingStore,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setForm(
        editingStore
          ? {
              name: editingStore.name,
              address: editingStore.address ?? "",
            }
          : emptyForm,
      );
    }
  }, [open, editingStore]);

  function updateField(field: keyof StoreForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(toRequest(form));
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message ||
          (editingStore
            ? "Failed to update store."
            : "Failed to create store."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleBackdropClick = dismissOnBackdropClick(onClose);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">
            {editingStore ? "Edit Store" : "New Store"}
          </h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Store Name</label>
            <input
              className="dialog-input"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Downtown Branch"
              required
              autoFocus
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Address</label>
            <textarea
              className="dialog-textarea"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Full street address"
              rows={3}
            />
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving…"
                : editingStore
                  ? "Save Changes"
                  : "Create Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
