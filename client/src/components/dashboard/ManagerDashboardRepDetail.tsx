import { useEffect, useState } from "react";
import { getManagerRepWeekDetail } from "../../services/dashboardService";
import { resolveAssetUrl } from "../../services/apiClient";
import type { DashboardVisit, ManagerRepWeekDetail } from "../../types/dashboard";
import { DASHBOARD_STATUS_LABELS, addDaysIso, formatWeekRange, mondayOf } from "../../types/dashboard";
import BackButton from "../common/BackButton";
import PhotoLightbox from "../store/PhotoLightbox";
import "../store/Stores.css";
import "./ManagerDashboard.css";

interface Props {
  repId: string;
  weekStart: string;
  onWeekChange: (weekStart: string) => void;
  onBack: () => void;
}

const STATUS_CLASS: Record<DashboardVisit["status"], string> = {
  PLANNED: "status-planned",
  DUE_TODAY: "status-due-today",
  SUBMITTED: "status-submitted",
  NEEDS_REVIEW: "status-needs-review",
  COMPLETED: "status-submitted",
  MISSED: "status-missed",
  CANCELLED: "status-cancelled",
};

export default function ManagerDashboardRepDetail({ repId, weekStart, onWeekChange, onBack }: Props) {
  const [detail, setDetail] = useState<ManagerRepWeekDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getManagerRepWeekDetail(repId, weekStart);
        if (!cancelled) setDetail(res);
      } catch {
        if (!cancelled) setError("Failed to load this rep's week.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [repId, weekStart]);

  const isCurrentWeek = weekStart === mondayOf(new Date());
  const totals = detail?.totals;

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <BackButton label="All reps" onClick={onBack} />
          <h1 className="stores-title">{detail?.repName ?? "Rep"}</h1>
        </div>
        <div className="toolbar-right dash-week-nav">
          <button
            className="rep-calendar-nav"
            type="button"
            onClick={() => onWeekChange(addDaysIso(weekStart, -7))}
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="dash-week-label">
            {detail ? formatWeekRange(detail.weekStart, detail.weekEnd) : "—"}
          </span>
          <button
            className="rep-calendar-nav"
            type="button"
            onClick={() => onWeekChange(addDaysIso(weekStart, 7))}
            aria-label="Next week"
          >
            ›
          </button>
          {!isCurrentWeek && (
            <button className="btn btn-ghost" type="button" onClick={() => onWeekChange(mondayOf(new Date()))}>
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
          <span className="dash-kpi-value">{totals ? totals.outletsSubmitted : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Missed</span>
          <span className="dash-kpi-value dash-kpi-value--warn">{totals ? totals.outletsMissed : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Graded</span>
          <span className="dash-kpi-value">{totals ? totals.outletsGraded : "—"}</span>
        </div>
        <div className="dash-kpi-tile">
          <span className="dash-kpi-label">Avg score</span>
          <span className="dash-kpi-value">
            {totals && totals.avgScore != null ? `${Math.round(totals.avgScore)}%` : "—"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="table-state">
          <span className="spinner" /> Loading…
        </div>
      ) : (
        <div className="dash-day-columns">
          {detail?.days.map((day) => (
            <div className="dash-day-column" key={day.date}>
              <div className="dash-day-header">{day.dayLabel}</div>
              {day.visits.length === 0 ? (
                <p className="dash-day-empty">No visits</p>
              ) : (
                <div className="dash-day-visits">
                  {day.visits.map((visit, idx) => (
                    <div className="dash-visit-card" key={`${visit.storeId}-${idx}`}>
                      <strong>{visit.storeName}</strong>
                      <span className={`status-badge ${STATUS_CLASS[visit.status]}`}>
                        {DASHBOARD_STATUS_LABELS[visit.status]}
                      </span>
                      {visit.score != null && (
                        <span className="dash-visit-score">{Math.round(visit.score)}%</span>
                      )}
                      {visit.photos.length > 0 && (
                        <div className="dash-visit-photos">
                          {visit.photos.map((photo, photoIdx) => (
                            <button
                              key={photo.submissionId}
                              type="button"
                              className="dash-visit-photo-thumb"
                              onClick={() =>
                                setViewingPhoto({
                                  url: resolveAssetUrl(photo.photoUrl),
                                  name: `${visit.storeName} — photo ${photoIdx + 1}${photo.submittedAt ? ` (${photo.submittedAt})` : ""}`,
                                })
                              }
                              aria-label={`View photo ${photoIdx + 1} for ${visit.storeName}`}
                            >
                              <img src={resolveAssetUrl(photo.photoUrl)} alt="" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingPhoto && (
        <PhotoLightbox
          url={viewingPhoto.url}
          name={viewingPhoto.name}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  );
}
