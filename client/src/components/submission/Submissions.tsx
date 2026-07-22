import { useEffect, useMemo, useState } from "react";
import { getSubmissions } from "../../services/submissionService";
import { getStores } from "../../services/storeService";
import { getReps } from "../../services/repService";
import type { SubmissionSummary } from "../../types/submission";
import type { Store } from "../../types/store";
import type { Rep } from "../../types/rep";
import { resolveAssetUrl } from "../../services/apiClient";
import StarRating from "../common/StarRating";
import SubmissionDetail from "./SubmissionDetail";
import "../store/Stores.css";
import "./Submissions.css";

const PAGE_SIZE = 20;

interface Props {
  companyId?: string | null;
}

function statusBadge(status: SubmissionSummary["status"], flagged: boolean) {
  if (flagged) {
    return <span className="sub-badge sub-badge-flagged">⚑ Flagged</span>;
  }
  if (status === "REVIEWED") {
    return <span className="sub-badge sub-badge-reviewed">✓ Reviewed</span>;
  }
  return <span className="sub-badge sub-badge-scored">Scored</span>;
}

function scoreClass(score: number): string {
  if (score >= 90) return "sub-score-green";
  if (score >= 60) return "sub-score-orange";
  return "sub-score-red";
}

export default function Submissions({ companyId }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stores, setStores] = useState<Store[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState("");
  const [stars, setStars] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [companyId, storeId, repId, stars]);

  useEffect(() => {
    load();
  }, [page, companyId, storeId, repId, stars]);

  useEffect(() => {
    let cancelled = false;
    async function loadFilters() {
      try {
        const [storeRes, repRes] = await Promise.all([
          getStores({ page: 0, size: 200, companyId: companyId ?? undefined }),
          getReps(0, 200, companyId),
        ]);
        if (!cancelled) {
          setStores(storeRes.content);
          setReps(repRes.content);
        }
      } catch {
        // filter dropdowns are non-critical; leave empty on failure
      }
    }
    loadFilters();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await getSubmissions({
        page,
        size: PAGE_SIZE,
        companyId,
        storeId: storeId || null,
        repId: repId || null,
        stars: stars !== "" ? Number(stars) : null,
      });
      setSubmissions(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }

  const hasActiveFilters = useMemo(
    () => storeId !== "" || repId !== "" || stars !== "",
    [storeId, repId, stars],
  );

  if (selectedId) {
    return <SubmissionDetail submissionId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Submissions</h1>
          {!loading && (
            <span className="stores-count">
              {totalElements} scored submission{totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="rep-filters" aria-label="Submission filters">
        <label className="filter-field">
          <span>Store</span>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Rep</span>
          <select value={repId} onChange={(e) => setRepId(e.target.value)}>
            <option value="">All reps</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name} {r.surname ?? ""}</option>
            ))}
          </select>
        </label>

        <label className="filter-field sub-star-filter">
          <span>Rating</span>
          <div className="sub-star-filter-row">
            <StarRating
              stars={0}
              activeStars={stars !== "" ? Number(stars) : null}
              size="lg"
              onClick={(n) => setStars(stars === String(n) ? "" : String(n))}
            />
            {stars !== "" && (
              <button
                type="button"
                className="sub-star-filter-clear"
                onClick={() => setStars("")}
                title="Clear rating filter"
                aria-label="Clear rating filter"
              >
                ✕
              </button>
            )}
          </div>
        </label>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table submissions-table">
          <thead>
            <tr>
              <th>Rep</th>
              <th>Store</th>
              <th>Planogram</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Score</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-state">
                  <span className="spinner" /> Loading…
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-state">
                  {hasActiveFilters ? "No submissions match these filters." : "No scored submissions yet."}
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="store-row sub-row" onClick={() => setSelectedId(s.id)}>
                  <td>
                    <div className="store-cell">
                      {s.photoUrl ? (
                        <img
                          src={resolveAssetUrl(s.photoUrl)}
                          alt=""
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
                        <div className="store-avatar" style={{ background: "linear-gradient(135deg, #4f6ef7 0%, #7c93f7 100%)" }}>
                          {s.repName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="store-name">{s.repName}</div>
                    </div>
                  </td>
                  <td>{s.storeName}</td>
                  <td className="text-muted">{s.planogramName ?? "—"}</td>
                  <td className="text-muted" style={{ fontSize: "13px" }}>{s.submittedAt}</td>
                  <td>{statusBadge(s.status, s.flaggedForReview)}</td>
                  <td className={`sub-score ${scoreClass(s.overallScore)}`}>
                    {Math.round(s.overallScore)}
                  </td>
                  <td>
                    <StarRating stars={s.stars} score={s.overallScore} size="lg" />
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
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
