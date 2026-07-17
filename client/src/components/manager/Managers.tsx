import { useEffect, useState } from "react";
import {
  createManager,
  deleteManager,
  getManagers,
  updateManager,
} from "../../services/managerService";
import type { Manager, ManagerPageResponse, ManagerRequest } from "../../types/manager";
import ConfirmDialog from "../common/ConfirmDialog";
import "../store/Stores.css";
import ManagerDialog from "./ManagerDialog";

const PAGE_SIZE = 5;

interface Props {
  companyId?: string | null;
}

export default function Managers({ companyId }: Props) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [confirmManager, setConfirmManager] = useState<Manager | null>(null);

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
      const res: ManagerPageResponse = await getManagers(page, PAGE_SIZE, companyId);
      setManagers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError("Failed to load managers.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(req: ManagerRequest) {
    if (editingManager) {
      const updated = await updateManager(editingManager.id, req);
      setManagers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } else {
      await createManager(req);
      setPage(0);
      await load();
    }
  }

  async function confirmDelete() {
    if (!confirmManager) return;
    const manager = confirmManager;
    setConfirmManager(null);
    try {
      await deleteManager(manager.id);
      const isLastOnPage = managers.length === 1 && page > 0;
      if (isLastOnPage) setPage((p) => p - 1);
      else await load();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete manager.");
    }
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Managers</h1>
          {!loading && (
            <span className="stores-count">
              {totalElements} manager{totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingManager(null); setDialogOpen(true); }}
          >
            <span>＋</span> Add Manager
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Manager</th>
              <th>Phone</th>
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
            ) : managers.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-state">No managers found.</td>
              </tr>
            ) : (
              managers.map((m) => (
                <tr key={m.id} className="store-row">
                  <td>
                    <div className="store-cell">
                      <div className="store-avatar rep-avatar">
                        {m.name.slice(0, 1).toUpperCase()}
                        {(m.surname ?? "").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="store-name">
                          {m.name}{m.surname ? ` ${m.surname}` : ""}
                        </div>
                        <div className="store-id">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{m.phone ?? "—"}</td>
                  <td>
                    <span className="company-badge">{m.companyName}</span>
                  </td>
                  <td className="text-muted">{m.createdAt ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => { setEditingManager(m); setDialogOpen(true); }}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={() => setConfirmManager(m)}
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

      <ManagerDialog
        open={dialogOpen}
        editingManager={editingManager}
        onClose={() => { setDialogOpen(false); setEditingManager(null); }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={confirmManager !== null}
        title="Delete Manager"
        message={`Are you sure you want to delete "${confirmManager?.name}${confirmManager?.surname ? ` ${confirmManager.surname}` : ""}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmManager(null)}
      />
    </div>
  );
}
