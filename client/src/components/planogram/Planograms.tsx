import { useEffect, useState } from "react";
import {
  createPlanogram,
  deletePlanogram,
  getPlanograms,
} from "../../services/planogramService";
import type { Planogram, PlanogramRequest } from "../../types/planogram";
import type { UserRole } from "../../types/auth";
import { resolveAssetUrl } from "../../services/apiClient";
import ConfirmDialog from "../common/ConfirmDialog";
import "../store/Stores.css";
import PlanogramDialog from "./PlanogramDialog";
import PlanogramDetail from "./PlanogramDetail";

const PAGE_SIZE = 20;

interface Props {
  role?: UserRole;
}

export default function Planograms({ role }: Props) {
  const [planograms, setPlanograms] = useState<Planogram[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<Planogram | null>(null);
  const [selected, setSelected] = useState<Planogram | null>(null);

  useEffect(() => {
    load();
  }, [page]);

  // Poll while any planogram is still being parsed by AI
  useEffect(() => {
    const hasUnparsed = planograms.some((p) => !p.parsed);
    if (!hasUnparsed) return;
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [planograms]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const items = await getPlanograms(page, PAGE_SIZE);
      setPlanograms(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      setError("Failed to load planograms.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(req: PlanogramRequest, image: File | null) {
    await createPlanogram(req, image);
    setPage(0);
    await load();
  }

  async function confirmDelete() {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);
    try {
      await deletePlanogram(item.id);
      await load();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete planogram.");
    }
  }

  if (selected) {
    return (
      <PlanogramDetail
        planogram={selected}
        onBack={() => setSelected(null)}
        onUpdated={(updated) => {
          setSelected(updated);
          setPlanograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />
    );
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Planograms</h1>
          {!loading && (
            <span className="stores-count">
              {planograms.length} planogram{planograms.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
            <span>＋</span> Add Planogram
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Planogram</th>
              <th>Store</th>
              <th>Category</th>
              <th>Valid Period</th>
              <th>AI Status</th>
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
            ) : planograms.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-state">No planograms found.</td>
              </tr>
            ) : (
              planograms.map((p) => (
                <tr
                  key={p.id}
                  className="store-row"
                  style={p.parsed ? { cursor: "pointer" } : undefined}
                  onClick={() => p.parsed && setSelected(p)}
                >
                  <td>
                    <div className="store-cell">
                      {p.referenceImageUrl ? (
                        <img
                          src={resolveAssetUrl(p.referenceImageUrl)}
                          alt={p.name}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          className="store-avatar"
                          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="store-name">{p.name}</div>
                        <div className="store-id">
                          {p.active
                            ? <span style={{ color: "var(--success)" }}>Active</span>
                            : <span style={{ color: "var(--text-secondary)" }}>Inactive</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.storeName
                      ? <span className="company-badge">{p.storeName}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-muted">{p.productCategory ?? "—"}</td>
                  <td className="text-muted" style={{ fontSize: "13px" }}>
                    {p.validFrom || p.validUntil
                      ? `${p.validFrom ?? "∞"} → ${p.validUntil ?? "∞"}`
                      : "Always active"}
                  </td>
                  <td>
                    {p.parsed ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "12px", fontWeight: 500, color: "var(--success)",
                        background: "rgba(34,197,94,0.1)", padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                      }}>
                        ✓ Parsed
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)",
                        background: "var(--surface-raised)", padding: "2px 8px",
                        borderRadius: "var(--radius-full)", border: "1px solid var(--border)",
                      }}>
                        ○ Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {p.parsed && (
                        <button
                          className="icon-btn"
                          title="View & link products"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(p);
                          }}
                        >
                          ☰
                        </button>
                      )}
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmItem(p);
                        }}
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
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      <PlanogramDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={confirmItem !== null}
        title="Delete Planogram"
        message={`Delete "${confirmItem?.name}"? All store assignments for this planogram will also be removed.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}
