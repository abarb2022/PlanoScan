import { FormEvent, useEffect, useRef, useState } from "react";
import type { Product } from "../../types/product";
import { resolveAssetUrl } from "../../services/apiClient";
import "../store/StoreDialog.css";

interface Props {
  open: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ProductDialog({ open, editingProduct, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (editingProduct) {
        setName(editingProduct.name);
        setSku(editingProduct.sku ?? "");
        setDescription(editingProduct.description ?? "");
      } else {
        setName("");
        setSku("");
        setDescription("");
      }
    }
  }, [open, editingProduct]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data: Record<string, string> = { name: name.trim() };
      if (sku.trim()) data.sku = sku.trim();
      if (description.trim()) data.description = description.trim();
      const formData = new FormData();
      formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
      if (imageFile) formData.append("referenceImage", imageFile);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (editingProduct ? "Failed to update product." : "Failed to create product."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const previewUrl =
    editingProduct?.referenceImageUrl
      ? resolveAssetUrl(editingProduct.referenceImageUrl)
      : null;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">{editingProduct ? "Edit Product" : "Add Product"}</h2>
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
              placeholder="e.g. Coca-Cola 500ml"
              required
              autoFocus
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">SKU</label>
            <input
              className="dialog-input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. CC-500-RD"
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Description</label>
            <textarea
              className="dialog-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional product description"
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Reference Image</label>
            {previewUrl && !imageFile && (
              <img
                src={previewUrl}
                alt="Current reference"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "140px",
                  objectFit: "contain",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "8px",
                  border: "1px solid var(--border)",
                }}
              />
            )}
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
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : editingProduct ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
