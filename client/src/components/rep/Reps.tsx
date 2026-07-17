import { useEffect, useState } from "react";
import {
  createRep,
  deleteRep,
  getReps,
  updateRep,
} from "../../services/repService";
import type { Rep, RepPageResponse, RepRequest } from "../../types/rep";
import ConfirmDialog from "../common/ConfirmDialog";
import RepAssignmentsModal from "./RepAssignmentsModal";
import RepDialog from "./RepDialog";
import "../store/Stores.css";
import "./Reps.css";

const PAGE_SIZE = 5;

interface Props {
  companyId?: string | null;
}

export default function Reps({ companyId }: Props) {
  const [reps, setReps] = useState<Rep[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Rep | null>(null);
  const [assignmentsRep, setAssignmentsRep] = useState<Rep | null>(null);
  const [confirmRep, setConfirmRep] = useState<Rep | null>(null);

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
      const res: RepPageResponse = await getReps(page, PAGE_SIZE, companyId);
      setReps(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError("Failed to load reps.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingRep(null);
    setDialogOpen(true);
  }

  function openEdit(rep: Rep) {
    setEditingRep(rep);
    setDialogOpen(true);
  }

  async function handleSave(req: RepRequest) {
    if (editingRep) {
      const updated = await updateRep(editingRep.id, req);
      setReps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } else {
      await createRep(req);
      setPage(0);
      await load();
    }
  }

  function handleDelete(rep: Rep) {
    setConfirmRep(rep);
  }

  async function confirmDelete() {
    if (!confirmRep) return;
    const rep = confirmRep;
    setConfirmRep(null);
    try {
      await deleteRep(rep.id);
      const isLastOnPage = reps.length === 1 && page > 0;
      if (isLastOnPage) setPage((p) => p - 1);
      else await load();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete rep.");
    }
  }

  return (
    <div className="reps-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Reps</h1>
          {!loading && (
            <span className="stores-count">
              {totalElements} rep{totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>
            <span>＋</span> Add Rep
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Rep</th>
              <th>Company</th>
              <th>Created</th>
              <th>Store Assignments</th>
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
            ) : reps.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-state">
                  No reps found.
                </td>
              </tr>
            ) : (
              reps.map((rep) => (
                <tr key={rep.id} className="store-row">
                  <td>
                    <div className="store-cell">
                      <div className="store-avatar rep-avatar">
                        {rep.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="store-name">{rep.name}</div>
                        <div className="store-id">{rep.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="company-badge">{rep.companyName}</span>
                  </td>
                  <td className="text-muted">{rep.createdAt ?? "—"}</td>
                  <td>
                    {rep.assignedStores.length === 0 ? (
                      <span className="no-stores-hint">—</span>
                    ) : (
                      <div className="store-pills">
                        {rep.assignedStores.slice(0, 3).map((s) => (
                          <span key={s.id} className="store-pill">{s.name}</span>
                        ))}
                        {rep.assignedStores.length > 3 && (
                          <span className="store-pill store-pill--more">
                            +{rep.assignedStores.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn-manage"
                        title="Manage store assignments"
                        onClick={() => setAssignmentsRep(rep)}
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1.5" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 4.5h8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <rect x="1.5" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 9h8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <rect x="1.5" y="11.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 13.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => openEdit(rep)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={() => handleDelete(rep)}
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

      <RepDialog
        open={dialogOpen}
        editingRep={editingRep}
        onClose={() => { setDialogOpen(false); setEditingRep(null); }}
        onSubmit={handleSave}
      />

      {assignmentsRep && (
        <RepAssignmentsModal
          rep={assignmentsRep}
          onClose={() => setAssignmentsRep(null)}
        />
      )}

      <ConfirmDialog
        open={confirmRep !== null}
        title="Delete Rep"
        message={`Are you sure you want to delete "${confirmRep?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmRep(null)}
      />
    </div>
  );
}
