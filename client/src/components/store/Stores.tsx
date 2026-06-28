import { useEffect, useState } from "react";
import {
  createStore,
  deleteStore,
  getStores,
  updateStore,
} from "../../services/storeService";
import type { Store, StorePageResponse, StoreRequest } from "../../types/store";
import ConfirmDialog from "../common/ConfirmDialog";
import StoreDialog from "./StoreDialog";
import "./Stores.css";

const PAGE_SIZE = 5;

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [companyFilter, setCompanyFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [confirmStore, setConfirmStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStores();
  }, [page, companyFilter]);

  async function loadStores() {
    try {
      setLoading(true);
      setError("");
      const res: StorePageResponse = await getStores({
        page,
        size: PAGE_SIZE,
        companyId: companyFilter,
      });
      setStores(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError("Failed to load stores.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingStore(null);
    setDialogOpen(true);
  }

  function openEdit(store: Store) {
    setEditingStore(store);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingStore(null);
  }

  async function handleSave(req: StoreRequest) {
    if (editingStore) {
      const updated = await updateStore(editingStore.id, req);
      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      await createStore(req);
      setPage(0);
      await loadStores();
    }
  }

  async function handleDelete(store: Store) {
    setConfirmStore(store);
  }

  async function confirmDelete() {
    if (!confirmStore) return;
    const store = confirmStore;
    setConfirmStore(null);
    try {
      await deleteStore(store.id);
      const isLastOnPage = stores.length === 1 && page > 0;
      if (isLastOnPage) setPage((p) => p - 1);
      else await loadStores();
    } catch {
      setError("Failed to delete store.");
    }
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Stores</h1>
          {!loading && (
            <span className="stores-count">
              {totalElements} location{totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="toolbar-right">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="Filter by company ID…"
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <button className="btn btn-primary" onClick={openCreate}>
            <span>＋</span> Add Store
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Store</th>
              <th>Address</th>
              <th>Company</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="table-state">
                  <span className="spinner" /> Loading…
                </td>
              </tr>
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-state">
                  No stores found.
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="store-row">
                  <td>
                    <div className="store-cell">
                      <div className="store-avatar">
                        {store.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="store-name">{store.name}</div>
                        <div className="store-id">#{store.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{store.address || "—"}</td>
                  <td>
                    <span className="company-badge">
                      {store.companyName ?? store.companyId}
                    </span>
                  </td>
                  <td className="text-muted">{store.createdAt ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => openEdit(store)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={() => handleDelete(store)}
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
        <span className="page-info">
          Page {page + 1} of {totalPages || 1}
        </span>
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

      <StoreDialog
        open={dialogOpen}
        editingStore={editingStore}
        onClose={closeDialog}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={confirmStore !== null}
        title="Delete Store"
        message={`Are you sure you want to delete "${confirmStore?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmStore(null)}
      />
    </div>
  );
}
