import { useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { resolveAssetUrl } from "../../services/apiClient";
import "../store/StoreDialog.css";
import "./PlanogramDetail.css";

interface Props {
  open: boolean;
  title: string;
  products: Product[];
  loading: boolean;
  selectedProductId: string | null;
  onSelect: (productId: string | null) => void;
  onClose: () => void;
}

export default function ProductPicker({
  open,
  title,
  products,
  loading,
  selectedProductId,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog picker-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header picker-header">
          <div>
            <h2 className="dialog-title">Choose Product</h2>
            <p className="picker-subtitle">{title}</p>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="picker-search-row">
          <span className="picker-search-icon">🔍</span>
          <input
            className="picker-search-input"
            placeholder="Search by product name or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="picker-body">
          {loading ? (
            <div className="picker-state"><span className="spinner" /> Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="picker-state">No products match "{query}".</div>
          ) : (
            <div className="picker-grid">
              <button
                className={`picker-card picker-card-none ${selectedProductId === null ? "picker-card-selected" : ""}`}
                onClick={() => onSelect(null)}
              >
                <div className="picker-thumb picker-thumb-empty">✕</div>
                <span className="picker-card-name">No product</span>
              </button>

              {filtered.map((p) => (
                <button
                  key={p.id}
                  className={`picker-card ${selectedProductId === p.id ? "picker-card-selected" : ""}`}
                  onClick={() => onSelect(p.id)}
                >
                  {p.referenceImageUrl ? (
                    <img
                      className="picker-thumb"
                      src={resolveAssetUrl(p.referenceImageUrl)}
                      alt={p.name}
                    />
                  ) : (
                    <div className="picker-thumb picker-thumb-placeholder">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="picker-card-name">{p.name}</span>
                  {p.sku && <span className="picker-card-sku">SKU: {p.sku}</span>}
                  {selectedProductId === p.id && <span className="picker-card-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
