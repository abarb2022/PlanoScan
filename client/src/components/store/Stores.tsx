import { useEffect, useState } from "react";
import {
  createStore,
  deleteStore,
  getRepAssignments,
  getStores,
  updateStore,
} from "../../services/storeService";
import type { UserRole } from "../../types/auth";
import type {
  RepAssignmentStatus,
  RepAssignmentTab,
  RepDateFilter,
  RepStatusFilter,
  RepStoreAssignment,
  Store,
  StorePageResponse,
  StoreRequest,
} from "../../types/store";

const REP_PAGE_SIZE = 5;
import StoreDialog from "./StoreDialog";
import "./Stores.css";

const PAGE_SIZE = 5;

const ASSIGNMENT_STATUS_LABELS: Record<RepAssignmentStatus, string> = {
  DUE_TODAY: "Due today",
  SUBMITTED: "Submitted",
  NEEDS_REVIEW: "Needs review",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

const FILTERABLE_STATUSES: RepAssignmentStatus[] = [
  "DUE_TODAY",
  "SUBMITTED",
  "NEEDS_REVIEW",
  "MISSED",
];

function assignmentStatusLabel(status: RepAssignmentStatus) {
  return ASSIGNMENT_STATUS_LABELS[status];
}

function assignmentStatusClass(status: RepAssignmentStatus) {
  return status.toLowerCase().replace(/_/g, "-");
}

interface StoresProps {
  userRole?: UserRole;
}

export default function Stores({ userRole }: StoresProps) {
  if (userRole === "REP") {
    return <RepStores />;
  }

  return <ManagerStores />;
}

function ManagerStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [companyFilter, setCompanyFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

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
    if (!confirm(`Delete "${store.name}"? This cannot be undone.`)) return;
    try {
      await deleteStore(store.id);
      const isLastOnPage = stores.length === 1 && page > 0;
      if (isLastOnPage) {
        setPage((p) => p - 1);
      } else {
        await loadStores();
      }
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
    </div>
  );
}

function RepStores() {
  const [assignments, setAssignments] = useState<RepStoreAssignment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<RepAssignmentTab>("active");
  const [dateFilter, setDateFilter] = useState<RepDateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RepStatusFilter>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeAssignmentCount, setActiveAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedId) ??
    assignments[0];

  useEffect(() => {
    setPage(0);
  }, [activeTab, dateFilter, statusFilter]);

  useEffect(() => {
    loadAssignments();
  }, [activeTab, dateFilter, statusFilter, page]);

  useEffect(() => {
    loadActiveAssignmentCount();
  }, []);

  useEffect(() => {
    if (assignments.length === 0) {
      setSelectedId("");
      return;
    }

    if (!assignments.some((assignment) => assignment.id === selectedId)) {
      setSelectedId(assignments[0].id);
    }
  }, [selectedId, assignments]);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");
      const res = await getRepAssignments({
        tab: activeTab,
        date: dateFilter,
        status: statusFilter,
        page,
        size: REP_PAGE_SIZE,
      });
      setAssignments(res.content);
      setTotalPages(res.totalPages);
    } catch {
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveAssignmentCount() {
    try {
      const res = await getRepAssignments({
        tab: "active",
        date: "all",
        status: "all",
        page: 0,
        size: 1,
      });
      setActiveAssignmentCount(res.totalElements);
    } catch {
      setActiveAssignmentCount(0);
    }
  }

  function clearFilters() {
    setDateFilter("all");
    setStatusFilter("all");
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">My Stores</h1>
          <span className="stores-count">
            {activeAssignmentCount} active assignment
            {activeAssignmentCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="rep-layout">
        <section className="rep-main-panel" aria-label="Assigned stores">
          <div className="rep-tabs" role="tablist" aria-label="Assignment view">
            <button
              className={`rep-tab ${activeTab === "active" ? "rep-tab-active" : ""}`}
              onClick={() => setActiveTab("active")}
              type="button"
            >
              Assigned stores
            </button>
            <button
              className={`rep-tab ${activeTab === "history" ? "rep-tab-active" : ""}`}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              History
            </button>
          </div>

          <div className="rep-filters" aria-label="Assignment filters">
            <label className="filter-field">
              <span>Date</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as RepDateFilter)}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="older">Older</option>
              </select>
            </label>

            <label className="filter-field">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as RepStatusFilter)
                }
              >
                <option value="all">All statuses</option>
                {FILTERABLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {assignmentStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn btn-ghost"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>

          <div className="stores-table-wrapper rep-table-wrapper">
            <table className="stores-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Assignment</th>
                  <th>Status</th>
                  <th>Last submission</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="table-state">
                      <span className="spinner" /> Loading…
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-state">
                      No assignments match these filters.
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className={`store-row rep-store-row ${
                        selectedAssignment?.id === assignment.id
                          ? "rep-store-row-selected"
                          : ""
                      }`}
                      onClick={() => setSelectedId(assignment.id)}
                    >
                      <td>
                        <div className="store-cell">
                          <div className="store-avatar">
                            {assignment.store.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="store-name">
                              {assignment.store.name}
                            </div>
                            <div className="store-id">
                              {assignment.store.address ?? "No address"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="assignment-cell">
                          <strong>{assignment.assignmentDate}</strong>
                          <span>{assignment.dueWindow}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${assignmentStatusClass(
                            assignment.status,
                          )}`}
                        >
                          {assignmentStatusLabel(assignment.status)}
                        </span>
                      </td>
                      <td className="text-muted">
                        {assignment.lastSubmittedAt ?? "No submission yet"}
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
        </section>

        {selectedAssignment && (
          <AssignmentDetail assignment={selectedAssignment} />
        )}
      </div>
    </div>
  );
}

function AssignmentDetail({ assignment }: { assignment: RepStoreAssignment }) {
  const canSubmit = assignment.status === "DUE_TODAY";

  return (
    <aside className="assignment-detail" aria-label="Assignment details">
      <div className="assignment-detail-header">
        <div>
          <p className="detail-eyebrow">{assignment.assignmentDate}</p>
          <h2>{assignment.store.name}</h2>
          <p>{assignment.store.address}</p>
        </div>
        <span
          className={`status-badge status-${assignmentStatusClass(
            assignment.status,
          )}`}
        >
          {assignmentStatusLabel(assignment.status)}
        </span>
      </div>

      <div className="detail-grid">
        <div>
          <span>Company</span>
          <strong>{assignment.store.companyName}</strong>
        </div>
        <div>
          <span>Due window</span>
          <strong>{assignment.dueWindow}</strong>
        </div>
        <div>
          <span>Planogram</span>
          <strong>{assignment.planogram}</strong>
        </div>
        <div>
          <span>Assignment ID</span>
          <strong>#{assignment.id.replace("assignment-", "")}</strong>
        </div>
      </div>

      <div className="upload-panel">
        <div className="upload-panel__header">
          <div>
            <h3>Photo submission</h3>
            <p>Shelf photo pending for the selected assignment.</p>
          </div>
          <span className="upload-pill">1 photo</span>
        </div>
        <div className="upload-dropzone">
          <div className="upload-dropzone__icon" aria-hidden="true">
            ↑
          </div>
          <div className="upload-dropzone__copy">
            <strong>Drop a shelf photo here</strong>
            <span>PNG, JPG, or HEIC. One file per submission.</span>
          </div>
          <label className={`upload-action ${!canSubmit ? "is-disabled" : ""}`}>
            Upload photo
            <input disabled={!canSubmit} type="file" accept="image/*" />
          </label>
        </div>
        <div className="upload-actions">
          <button className="btn btn-primary" disabled={!canSubmit} type="button">
            Submit assignment
          </button>
        </div>
      </div>

      <div className="submissions-panel">
        <div className="panel-title-row">
          <h3>Submissions</h3>
          <span>{assignment.submissions.length}</span>
        </div>
        {assignment.submissions.length === 0 ? (
          <p className="empty-note">No submissions have been made yet.</p>
        ) : (
          <div className="submission-list">
            {assignment.submissions.map((submission) => (
              <div className="submission-item" key={submission.id}>
                <div>
                  <strong>{submission.photoName}</strong>
                  <span>{submission.submittedAt}</span>
                </div>
                <div className="submission-meta">
                  <span>{submission.status}</span>
                  {submission.score && <strong>{submission.score}</strong>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
