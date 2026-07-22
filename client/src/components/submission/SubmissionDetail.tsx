import { useEffect, useState } from "react";
import { getSubmission } from "../../services/submissionService";
import type { SubmissionDetail as SubmissionDetailData, SubmissionStatus } from "../../types/submission";
import type { Violation } from "../../types/review";
import { resolveAssetUrl } from "../../services/apiClient";
import StarRating from "../common/StarRating";
import BackButton from "../common/BackButton";
import "../store/Stores.css";
import "./Submissions.css";
import "./SubmissionDetail.css";

interface Props {
  submissionId: string;
  onBack: () => void;
}

function scoreBand(score: number): "green" | "orange" | "red" {
  if (score >= 90) return "green";
  if (score >= 60) return "orange";
  return "red";
}

function severityClass(severity: Violation["severity"]): string {
  if (severity === "HIGH") return "severity-high";
  if (severity === "MEDIUM") return "severity-medium";
  return "severity-low";
}

function statusLabel(status: SubmissionStatus): string {
  if (status === "REVIEWED") return "Reviewed";
  if (status === "SCORED") return "Scored";
  if (status === "PROCESSING") return "Processing";
  return "Pending";
}

export default function SubmissionDetail({ submissionId, onBack }: Props) {
  const [data, setData] = useState<SubmissionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getSubmission(submissionId);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setError("Failed to load submission details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  if (loading) {
    return (
      <div className="submission-detail">
        <div className="sd-header">
          <BackButton label="Back to Submissions" onClick={onBack} />
        </div>
        <div className="sd-loading"><span className="spinner" /> Loading…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="submission-detail">
        <div className="sd-header">
          <BackButton label="Back to Submissions" onClick={onBack} />
        </div>
        <p className="stores-error" style={{ margin: "24px 40px" }}>{error || "Submission not found."}</p>
      </div>
    );
  }

  const band = scoreBand(data.overallScore);
  const subScores = data.scoreDetail.subScores;

  return (
    <div className="submission-detail">
      <div className="sd-header">
        <BackButton label="Back to Submissions" onClick={onBack} />

        <div className="sd-header-main">
          <div className="sd-hero-photo" onClick={() => setLightboxOpen(true)}>
            <img src={resolveAssetUrl(data.photoUrl)} alt="Submission" />
            <span className="sd-hero-zoom">🔍</span>
          </div>

          <div className="sd-header-info">
            <h1 className="sd-title">{data.repName}</h1>
            <p className="sd-subtitle">{data.repEmail}</p>
            <div className="sd-meta-row">
              <span className="sd-badge">{data.storeName}</span>
              {data.planogramName && <span className="sd-badge sd-badge-muted">{data.planogramName}</span>}
              <span className={`sd-badge sd-badge-${data.flaggedForReview ? "flagged" : data.status === "REVIEWED" ? "success" : "muted"}`}>
                {data.flaggedForReview ? "⚑ Flagged for review" : statusLabel(data.status)}
              </span>
            </div>
            <p className="sd-dates">
              Submitted {data.submittedAt}
              {data.assignmentDate ? ` · Assigned ${data.assignmentDate}` : ""}
              {data.storeAddress ? ` · ${data.storeAddress}` : ""}
            </p>
          </div>

          <div className={`sd-score-block sd-score-${band}`}>
            <div className="sd-score-value">{Math.round(data.overallScore)}</div>
            <div className="sd-score-max">/ 100</div>
            <StarRating stars={data.stars} score={data.overallScore} size="lg" />
          </div>
        </div>
      </div>

      <div className="sd-body">
        <div className="sd-grid">
          <div className="sd-card">
            <h2 className="sd-card-title">Score Breakdown</h2>
            <div className="sd-meters">
              <ScoreMeter label="Brand Accuracy" value={subScores.brandAccuracy} />
              <ScoreMeter label="Quantity Accuracy" value={subScores.quantityAccuracy} />
              <ScoreMeter label="Position Accuracy" value={subScores.positionAccuracy} />
              <ScoreMeter label="Stock Fullness" value={subScores.stockFullness} />
            </div>
          </div>

          <div className="sd-card">
            <h2 className="sd-card-title">AI Assessment</h2>
            <div className="sd-confidence">
              <span className="sd-confidence-label">Confidence</span>
              <span className="sd-confidence-value">{Math.round(data.scoreDetail.confidence)}%</span>
            </div>
            {data.scoreDetail.notes ? (
              <p className="sd-notes">{data.scoreDetail.notes}</p>
            ) : (
              <p className="sd-notes sd-notes-empty">No additional notes from the AI.</p>
            )}
          </div>
        </div>

        <div className="sd-card">
          <h2 className="sd-card-title">
            Violations {data.scoreDetail.violations.length > 0 && `(${data.scoreDetail.violations.length})`}
          </h2>
          {data.scoreDetail.violations.length === 0 ? (
            <div className="sd-no-violations">
              <span>✓</span> No compliance violations detected.
            </div>
          ) : (
            <div className="sd-violations">
              {data.scoreDetail.violations.map((v, i) => (
                <div key={i} className="sd-violation">
                  <span className={`severity-badge ${severityClass(v.severity)}`}>{v.severity}</span>
                  <div className="sd-violation-body">
                    <span className="sd-violation-loc">Shelf {v.shelf} — {v.section}</span>
                    <span className="sd-violation-diff">
                      <strong>Expected:</strong> {v.expected} &nbsp;·&nbsp; <strong>Found:</strong> {v.found}
                    </span>
                    <span className="sd-violation-issue">{v.issue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sd-card">
          <h2 className="sd-card-title">Submitted Photo</h2>
          <img
            className="sd-full-photo"
            src={resolveAssetUrl(data.photoUrl)}
            alt="Submission"
            onClick={() => setLightboxOpen(true)}
          />
        </div>
      </div>

      {lightboxOpen && (
        <div className="sd-lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <img className="sd-lightbox-image" src={resolveAssetUrl(data.photoUrl)} alt="Submission full size" />
        </div>
      )}
    </div>
  );
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  const band = scoreBand(value);
  return (
    <div className="sd-meter">
      <div className="sd-meter-labels">
        <span>{label}</span>
        <span className="sd-meter-value">{value}</span>
      </div>
      <div className="sd-meter-track">
        <div className={`sd-meter-fill sd-meter-fill-${band}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
