import { useEffect, useState } from "react";
import { getManagerDashboardOverview } from "../../services/dashboardService";
import type { ManagerDashboardResponse, RepWeeklyStats } from "../../types/dashboard";
import { addDaysIso, formatWeekRange, mondayOf } from "../../types/dashboard";
import StarRating from "../common/StarRating";
import ManagerDashboardRepDetail from "./ManagerDashboardRepDetail";
import "../store/Stores.css";
import "./ManagerDashboard.css";

interface Props {
  companyId?: string | null;
}

function repInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export default function ManagerDashboard({ companyId }: Props) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [overview, setOverview] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getManagerDashboardOverview(weekStart, companyId);
        if (!cancelled) setOverview(res);
      } catch {
        if (!cancelled) setError("Failed to load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart, companyId]);

  const isCurrentWeek = weekStart === mondayOf(new Date());

  if (selectedRepId) {
    return (
      <ManagerDashboardRepDetail
        repId={selectedRepId}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        onBack={() => setSelectedRepId(null)}
      />
    );
  }

  const totals = overview?.companyTotals;

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Team Dashboard</h1>
          {!loading && overview && (
            <span className="stores-count">
              {overview.reps.length} rep{overview.reps.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right dash-week-nav">
          <button
            className="rep-calendar-nav"
            type="button"
            onClick={() => setWeekStart((w) => addDaysIso(w, -7))}
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="dash-week-label">
            {overview ? formatWeekRange(overview.weekStart, overview.weekEnd) : "—"}
          </span>
          <button
            className="rep-calendar-nav"
            type="button"
            onClick={() => setWeekStart((w) => addDaysIso(w, 7))}
            aria-label="Next week"
          >
            ›
          </button>
          {!isCurrentWeek && (
            <button className="btn btn-ghost" type="button" onClick={() => setWeekStart(mondayOf(new Date()))}>
              This week
            </button>
          )}
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="dash-kpi-row">
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Outlets planned</span>
          <span className="dash-kpi-value">{totals ? totals.outletsPlanned : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Submitted</span>
          <span className="dash-kpi-value-green">{totals ? totals.outletsSubmitted : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Missed</span>
          <span className="dash-kpi-value dash-kpi-value--warn">{totals ? totals.outletsMissed : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Graded</span>
          <span className="dash-kpi-value-green">{totals ? totals.outletsGraded : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Avg score</span>
          <span className="dash-kpi-value-orange">
            {totals && totals.avgScore != null ? `${Math.round(totals.avgScore)}%` : "—"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="table-state">
          <span className="spinner" /> Loading…
        </div>
      ) : !overview || overview.reps.length === 0 ? (
        <div className="table-state">No reps found for this company yet.</div>
      ) : (
        <div className="dash-rep-grid">
          {overview.reps.map((rep) => (
            <RepCard key={rep.repId} rep={rep} onClick={() => setSelectedRepId(rep.repId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RepCard({ rep, onClick }: { rep: RepWeeklyStats; onClick: () => void }) {
  const pct = rep.completionRate != null ? Math.round(rep.completionRate * 100) : 0;
  return (
    <button className="dash-rep-card" type="button" onClick={onClick}>
      <div className="dash-rep-card-header">
        <div className="store-avatar dash-rep-avatar">{repInitials(rep.repName)}</div>
        <div className="dash-rep-card-name">
          <strong>{rep.repName}</strong>
          <span>{rep.repEmail}</span>
        </div>
      </div>

      <div className="dash-rep-progress" title={`${pct}% completed`}>
        <div className="dash-rep-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="dash-rep-stats">
        <div className="dash-rep-stat">
          <span className="dash-rep-stat-value">{rep.totals.outletsPlanned}</span>
          <span className="dash-rep-stat-label">Planned</span>
        </div>
        <div className="dash-rep-stat">
          <span className="dash-rep-stat-value">{rep.totals.outletsSubmitted}</span>
          <span className="dash-rep-stat-label">Submitted</span>
        </div>
        <div className="dash-rep-stat">
          <span className="dash-rep-stat-value dash-rep-stat-value--warn">{rep.totals.outletsMissed}</span>
          <span className="dash-rep-stat-label">Missed</span>
        </div>
        <div className="dash-rep-stat">
          <span className="dash-rep-stat-value">{rep.totals.outletsGraded}</span>
          <span className="dash-rep-stat-label">Graded</span>
        </div>
      </div>

      <div className="dash-rep-score">
        {rep.totals.avgScore != null ? (
          <StarRating stars={Math.round(rep.totals.avgScore / 20)} score={rep.totals.avgScore} size="sm" />
        ) : (
          <span className="text-muted">No scores yet</span>
        )}
      </div>
    </button>
  );
}
