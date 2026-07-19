import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getRepAssignments } from "../../services/storeService";
import type {
  RepAssignmentStatus,
  RepAssignmentTab,
  RepDateFilter,
  RepStatusFilter,
  RepStoreAssignment,
  RepViewTab,
} from "../../types/store";
import AssignmentDetail from "./AssignmentDetail";
import RepCalendar from "./RepCalendar";

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

export default function RepStores({ activeTab }: { activeTab: RepViewTab }) {
  const [assignments, setAssignments] = useState<RepStoreAssignment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dateFilter, setDateFilter] = useState<RepDateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RepStatusFilter>("all");
  const [storeNameFilter, setStoreNameFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [activeAssignmentCount, setActiveAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const measureRowRef = useRef<HTMLTableRowElement>(null);
  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedId) ??
    assignments[0];
  const showAssignmentDate = activeTab === "history";

  useEffect(() => {
    setPage(0);
  }, [activeTab, dateFilter, statusFilter, storeNameFilter, pageSize]);

  useEffect(() => {
    if (pageSize === null || activeTab === "calendar") return;
    loadAssignments(activeTab, pageSize);
  }, [activeTab, dateFilter, statusFilter, storeNameFilter, page, pageSize]);

  // Measures a hidden reference row (not a real data row, which may not exist yet or may
  // currently be a loading/empty placeholder of a different height) so the page size is known
  // before the very first fetch, instead of guessing then correcting after data arrives.
  useLayoutEffect(() => {
    const wrapper = tableWrapperRef.current;
    const measureRow = measureRowRef.current;
    if (!wrapper || !measureRow) return;

    function recalculatePageSize() {
      if (!wrapper || !measureRow) return;
      const header = wrapper.querySelector("thead");
      if (!header) return;

      const rowHeight = measureRow.getBoundingClientRect().height;
      if (rowHeight === 0) return;

      const availableHeight =
        wrapper.clientHeight - header.getBoundingClientRect().height;
      const rows = Math.max(1, Math.floor(availableHeight / rowHeight));
      setPageSize((prev) => (prev === rows ? prev : rows));
    }

    recalculatePageSize();
    const observer = new ResizeObserver(recalculatePageSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

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

  async function loadAssignments(tab: RepAssignmentTab, size: number) {
    try {
      setLoading(true);
      setError("");
      const res = await getRepAssignments({
        tab,
        date: dateFilter,
        status: statusFilter,
        storeName: storeNameFilter,
        page,
        size,
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
    setStoreNameFilter("");
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

      {activeTab === "calendar" ? (
        <RepCalendar />
      ) : (
        <>
          {error && <p className="stores-error">{error}</p>}

          <div className="rep-layout">
            <section className="rep-main-panel" aria-label="Assigned stores">
              <div className="rep-filters" aria-label="Assignment filters">
                <label className="filter-field">
                  <span>Store</span>
                  <input
                    type="text"
                    placeholder="Filter by store name…"
                    value={storeNameFilter}
                    onChange={(e) => {
                      setStoreNameFilter(e.target.value);
                      setPage(0);
                    }}
                  />
                </label>

                <label className="filter-field">
                  <span>Date</span>
                  <select
                    value={dateFilter}
                    onChange={(e) =>
                      setDateFilter(e.target.value as RepDateFilter)
                    }
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

              <div
                className="stores-table-wrapper rep-table-wrapper"
                ref={tableWrapperRef}
              >
                <table
                  className="stores-table rep-table-measure"
                  aria-hidden="true"
                >
                  <tbody>
                    <tr ref={measureRowRef} className="store-row rep-store-row">
                      <td>
                        <div className="store-cell">
                          <div className="store-avatar">XX</div>
                          <div>
                            <div className="store-name">Measure</div>
                            <div className="store-id">Measure</div>
                          </div>
                        </div>
                      </td>
                      <td className="col-centered">
                        <span className="status-badge">Measure</span>
                      </td>
                      <td className="col-centered text-muted">Measure</td>
                    </tr>
                  </tbody>
                </table>

                <table className="stores-table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      {showAssignmentDate && (
                        <th className="col-centered">Assignment date</th>
                      )}
                      <th className="col-centered">Status</th>
                      <th className="col-centered">Last submission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading || pageSize === null ? (
                      <tr>
                        <td
                          colSpan={showAssignmentDate ? 4 : 3}
                          className="table-state"
                        >
                          <span className="spinner" /> Loading…
                        </td>
                      </tr>
                    ) : assignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={showAssignmentDate ? 4 : 3}
                          className="table-state"
                        >
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
                                {assignment.store.name
                                  .slice(0, 2)
                                  .toUpperCase()}
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
                          {showAssignmentDate && (
                            <td className="col-centered">
                              <div className="assignment-cell">
                                <strong>{assignment.assignmentDate}</strong>
                              </div>
                            </td>
                          )}
                          <td className="col-centered">
                            <span
                              className={`status-badge status-${assignmentStatusClass(
                                assignment.status,
                              )}`}
                            >
                              {assignmentStatusLabel(assignment.status)}
                            </span>
                          </td>
                          <td className="col-centered text-muted">
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
              <AssignmentDetail
                assignment={selectedAssignment}
                onSubmitted={() => {
                  if (pageSize !== null) loadAssignments(activeTab, pageSize);
                  loadActiveAssignmentCount();
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
