import { useEffect, useRef, useState, type UIEvent } from "react";
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
  COMPLETED: "Completed",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

const FILTERABLE_STATUSES: RepAssignmentStatus[] = [
  "DUE_TODAY",
  "SUBMITTED",
  "NEEDS_REVIEW",
  "COMPLETED",
  "MISSED",
];

function assignmentStatusLabel(status: RepAssignmentStatus) {
  return ASSIGNMENT_STATUS_LABELS[status];
}

function assignmentStatusClass(status: RepAssignmentStatus) {
  return status.toLowerCase().replace(/_/g, "-");
}

// Fetched in fixed-size batches and appended as the user scrolls — how many rows
// are actually visible at once is left entirely to the browser (container height,
// font size, zoom), not computed in JS.
const BATCH_SIZE = 100;
const LOAD_MORE_THRESHOLD_PX = 200;

export default function RepStores({ activeTab }: { activeTab: RepViewTab }) {
  const [assignments, setAssignments] = useState<RepStoreAssignment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateFilter, setDateFilter] = useState<RepDateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RepStatusFilter>("all");
  const [storeNameFilter, setStoreNameFilter] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [activeAssignmentCount, setActiveAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedId) ??
    assignments[0];
  const showAssignmentDate = activeTab === "history";
  const hasMore = assignments.length < totalElements;

  useEffect(() => {
    if (activeTab === "calendar") return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    loadInitial(activeTab);
  }, [activeTab, dateFilter, statusFilter, storeNameFilter]);

  useEffect(() => {
    setMobileView("list");
    setIsFullscreen(false);
  }, [activeTab]);

  // Poll while any loaded assignment has a submission still being scored
  useEffect(() => {
    if (activeTab === "calendar") return;
    const hasPending = assignments.some(
      (a) => a.status === "SUBMITTED" || a.status === "NEEDS_REVIEW"
    );
    if (!hasPending) return;
    const id = setInterval(() => refreshLoaded(activeTab), 8000);
    return () => clearInterval(id);
  }, [assignments, activeTab, loadedBatches]);

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

  function fetchBatch(tab: RepAssignmentTab, batchIndex: number) {
    return getRepAssignments({
      tab,
      date: dateFilter,
      status: statusFilter,
      storeName: storeNameFilter,
      page: batchIndex,
      size: BATCH_SIZE,
    });
  }

  async function loadInitial(tab: RepAssignmentTab) {
    try {
      setLoading(true);
      setError("");
      const res = await fetchBatch(tab, 0);
      setAssignments(res.content);
      setTotalElements(res.totalElements);
      setLoadedBatches(1);
    } catch {
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore(tab: RepAssignmentTab) {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await fetchBatch(tab, loadedBatches);
      setAssignments((prev) => [...prev, ...res.content]);
      setTotalElements(res.totalElements);
      setLoadedBatches((n) => n + 1);
    } catch {
      setError("Failed to load more assignments.");
    } finally {
      setLoadingMore(false);
    }
  }

  // Bypasses accumulation — re-fetches every batch loaded so far and replaces the
  // list in place, so a status change (new submission, score back) shows up without
  // resetting how much of the list has been loaded.
  async function refreshLoaded(tab: RepAssignmentTab) {
    try {
      setError("");
      const batches = await Promise.all(
        Array.from({ length: loadedBatches }, (_, i) => fetchBatch(tab, i)),
      );
      setAssignments(batches.flatMap((b) => b.content));
      setTotalElements(batches[batches.length - 1]?.totalElements ?? totalElements);
    } catch {
      setError("Failed to refresh assignments.");
    }
  }

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    if (activeTab === "calendar" || !hasMore) return;
    const el = e.currentTarget;
    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_THRESHOLD_PX;
    if (nearBottom) loadMore(activeTab);
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

          <div className="rep-layout" data-mobile-view={mobileView}>
            <section className="rep-main-panel" aria-label="Assigned stores">
              <div className="rep-filters" aria-label="Assignment filters">
                <label className="filter-field">
                  <span>Store</span>
                  <input
                    type="text"
                    placeholder="Filter by store name…"
                    value={storeNameFilter}
                    onChange={(e) => setStoreNameFilter(e.target.value)}
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
                ref={scrollRef}
                onScroll={handleScroll}
              >
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
                    {loading ? (
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
                      <>
                        {assignments.map((assignment) => (
                          <tr
                            key={assignment.id}
                            className={`store-row rep-store-row ${
                              selectedAssignment?.id === assignment.id
                                ? "rep-store-row-selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedId(assignment.id);
                              setMobileView("detail");
                            }}
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
                              <td className="col-centered" data-label="Assignment date">
                                <div className="assignment-cell">
                                  <strong>{assignment.assignmentDate}</strong>
                                </div>
                              </td>
                            )}
                            <td className="col-centered" data-label="Status">
                              <span
                                className={`status-badge status-${assignmentStatusClass(
                                  assignment.status,
                                )}`}
                              >
                                {assignmentStatusLabel(assignment.status)}
                              </span>
                            </td>
                            <td className="col-centered text-muted" data-label="Last submission">
                              {assignment.lastSubmittedAt ?? "No submission yet"}
                            </td>
                          </tr>
                        ))}
                        {loadingMore && (
                          <tr>
                            <td
                              colSpan={showAssignmentDate ? 4 : 3}
                              className="table-state"
                            >
                              <span className="spinner" /> Loading more…
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedAssignment && (
              <AssignmentDetail
                assignment={selectedAssignment}
                onBack={() => {
                  setMobileView("list");
                  setIsFullscreen(false);
                }}
                isFullscreen={isFullscreen}
                onFullscreenChange={setIsFullscreen}
                onSubmitted={() => {
                  refreshLoaded(activeTab);
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
