import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../services/productService";
import type { Product, ProductPageResponse } from "../../types/product";
import { resolveAssetUrl } from "../../services/apiClient";
import ConfirmDialog from "../common/ConfirmDialog";
import "../store/Stores.css";
import ProductDialog from "./ProductDialog";

const PAGE_SIZE = 10;

interface Props {
  companyId?: string | null;
}

export default function Products({ companyId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);

  useEffect(() => {
    setPage(0);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [page, companyId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res: ProductPageResponse = await getProducts(page, PAGE_SIZE, companyId);
      setProducts(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(formData: FormData) {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, formData);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      await createProduct(formData);
      setPage(0);
      await load();
    }
  }

  async function confirmDelete() {
    if (!confirmProduct) return;
    const product = confirmProduct;
    setConfirmProduct(null);
    try {
      await deleteProduct(product.id);
      const isLastOnPage = products.length === 1 && page > 0;
      if (isLastOnPage) setPage((p) => p - 1);
      else await load();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete product.");
    }
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Products</h1>
          {!loading && (
            <span className="stores-count">
              {totalElements} product{totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingProduct(null); setDialogOpen(true); }}
          >
            <span>＋</span> Add Product
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper" style={{ overflowY: "auto" }}>
        <table className="stores-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Company</th>
              <th>Description</th>
              <th>Reference Image</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-state">
                  <span className="spinner" /> Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-state">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="store-row">
                  <td>
                    <div className="store-cell">
                      <div
                        className="store-avatar"
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
                        }}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="store-name">{p.name}</div>
                        {p.sku && <div className="store-id">SKU: {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="company-badge">{p.companyName}</span>
                  </td>
                  <td className="text-muted" style={{ maxWidth: "220px" }}>
                    {p.description
                      ? p.description.length > 80
                        ? `${p.description.slice(0, 80)}…`
                        : p.description
                      : "—"}
                  </td>
                  <td>
                    {p.referenceImageUrl ? (
                      <img
                        src={resolveAssetUrl(p.referenceImageUrl)}
                        alt={p.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          objectFit: "cover",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted">{p.createdAt ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => { setEditingProduct(p); setDialogOpen(true); }}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={() => setConfirmProduct(p)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="stores-pagination">
        <span className="page-info">Page {page + 1} of {totalPages || 1}</span>
        <div className="page-btns">
          <button
            className="btn btn-ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <button
            className="btn btn-ghost"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      <ProductDialog
        open={dialogOpen}
        editingProduct={editingProduct}
        onClose={() => { setDialogOpen(false); setEditingProduct(null); }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={confirmProduct !== null}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmProduct?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmProduct(null)}
      />
    </div>
  );
}
