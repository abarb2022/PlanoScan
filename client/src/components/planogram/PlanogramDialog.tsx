import { FormEvent, useEffect, useRef, useState } from "react";
import type { Store } from "../../types/store";
import { getStores } from "../../services/storeService";
import "../store/StoreDialog.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: {
    name: string;
    storeId: string;
    productCategory?: string;
    validFrom?: string;
    validUntil?: string;
  }, image: File | null) => Promise<void>;
}

export default function PlanogramDialog({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setStoreId("");
      setProductCategory("");
      setValidFrom("");
      setValidUntil("");
      setImageFile(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      getStores({ page: 0, size: 200 })
        .then((res) => setStores(res.content))
        .catch(() => setStores([]));
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storeId) { setError("Please select a store."); return; }
    setError("");
    setSubmitting(true);
    try {
      const req: Parameters<typeof onSubmit>[0] = { name: name.trim(), storeId };
      if (productCategory.trim()) req.productCategory = productCategory.trim();
      if (validFrom) req.validFrom = validFrom;
      if (validUntil) req.validUntil = validUntil;
      await onSubmit(req, imageFile);
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to create planogram.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">Add Planogram</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Name</label>
            <input
              className="dialog-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beverage Fridge Q3 2025"
              required
              autoFocus
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Store</label>
            <select
              className="dialog-input"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              required
            >
              <option value="">— select store —</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.address ? ` — ${s.address}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Product Category</label>
            <input
              className="dialog-input"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              placeholder="e.g. Beverages"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="dialog-field">
              <label className="dialog-label">Valid From</label>
              <input
                type="date"
                className="dialog-input"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="dialog-field">
              <label className="dialog-label">Valid Until</label>
              <input
                type="date"
                className="dialog-input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Planogram Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="dialog-input"
              style={{ padding: "6px 10px" }}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile && (
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                Selected: {imageFile.name}
              </span>
            )}
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
              Upload the shelf layout image — AI will parse it automatically.
            </span>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Create Planogram"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
