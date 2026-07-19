import { FormEvent, useEffect, useState } from "react";
import { getFlaggedSubmissions, reviewSubmission } from "../../services/reviewService";
import type { FlaggedSubmission, Violation } from "../../types/review";
import { resolveAssetUrl } from "../../services/apiClient";
import "./FlaggedReviews.css";

interface Props {
  companyId?: string | null;
}

function scoreColorClass(score: number): string {
  if (score >= 90) return "score-green";
  if (score >= 60) return "score-orange";
  return "score-red";
}

function severityClass(severity: Violation["severity"]): string {
  if (severity === "HIGH") return "severity-high";
  if (severity === "MEDIUM") return "severity-medium";
  return "severity-low";
}

interface DisputeState {
  correctedScore: string;
  notes: string;
  submitting: boolean;
  error: string;
}

const emptyDispute = (): DisputeState => ({
  correctedScore: "",
  notes: "",
  submitting: false,
  error: "",
});

export default function FlaggedReviews({ companyId }: Props) {
  const [submissions, setSubmissions] = useState<FlaggedSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Track which card has the dispute form open: submissionId -> DisputeState
  const [disputeForms, setDisputeForms] = useState<Record<string, DisputeState>>({});

  useEffect(() => {
    load();
  }, [companyId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getFlaggedSubmissions(companyId);
      setSubmissions(data);
    } catch {
      setError("Failed to load flagged submissions.");
    } finally {
      setLoading(false);
    }
  }

  function openDispute(submissionId: string) {
    setDisputeForms((prev) => ({ ...prev, [submissionId]: emptyDispute() }));
  }

  function closeDispute(submissionId: string) {
    setDisputeForms((prev) => {
      const next = { ...prev };
      delete next[submissionId];
      return next;
    });
  }

  function updateDispute(submissionId: string, patch: Partial<DisputeState>) {
    setDisputeForms((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], ...patch },
    }));
  }

  async function handleAcknowledge(submissionId: string) {
    try {
      await reviewSubmission(submissionId, { action: "ACKNOWLEDGE" });
      setSubmissions((prev) => prev.filter((s) => s.submissionId !== submissionId));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to acknowledge submission.");
    }
  }

  async function handleDispute(e: FormEvent, submissionId: string) {
    e.preventDefault();
    const form = disputeForms[submissionId];
    if (!form) return;
    if (!form.notes.trim()) {
      updateDispute(submissionId, { error: "Notes are required when disputing." });
      return;
    }
    updateDispute(submissionId, { submitting: true, error: "" });
    try {
      const corrected = form.correctedScore.trim()
        ? Number(form.correctedScore.trim())
        : undefined;
      await reviewSubmission(submissionId, {
        action: "DISPUTE",
        correctedScore: corrected,
        notes: form.notes.trim(),
      });
      setSubmissions((prev) => prev.filter((s) => s.submissionId !== submissionId));
      closeDispute(submissionId);
    } catch (err: unknown) {
      updateDispute(submissionId, {
        submitting: false,
        error: (err instanceof Error ? err.message : "") || "Failed to submit dispute.",
      });
    }
  }

  return (
    <div className="reviews-page">
      <div className="reviews-toolbar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1 className="reviews-title">Flagged Reviews</h1>
          {!loading && (
            <span className="reviews-count">
              {submissions.length} flagged
            </span>
          )}
        </div>
      </div>

      {error && <p className="reviews-error">{error}</p>}

      {loading ? (
        <div className="reviews-loading">
          <span className="spinner" /> Loading…
        </div>
      ) : submissions.length === 0 ? (
        <div className="reviews-empty">
          <div className="reviews-empty-icon">✓</div>
          <p className="reviews-empty-title">No flagged submissions.</p>
          <p className="reviews-empty-sub">All scores are within acceptable range.</p>
        </div>
      ) : (
        <div className="review-card-list">
          {submissions.map((s) => {
            const dispute = disputeForms[s.submissionId];
            return (
              <div key={s.submissionId} className="review-card">
                {/* Header */}
                <div className="review-card-header">
                  <div className="review-card-meta">
                    <div className="review-rep-name">{s.repName}</div>
                    <div className="review-rep-email">{s.repEmail}</div>
                    <div className="review-store-line">
                      {s.storeName}
                      {s.storeAddress ? ` — ${s.storeAddress}` : ""}
                    </div>
                  </div>
                  <div className="review-dates">
                    <span>Assigned: {s.assignmentDate}</span>
                    <span>Submitted: {s.submittedAt}</span>
                  </div>
                </div>

                {/* Score row */}
                <div className="review-score-row">
                  <div>
                    <div className={`review-overall-score ${scoreColorClass(s.overallScore)}`}>
                      {s.overallScore}
                    </div>
                    <div className="review-score-label">Overall</div>
                  </div>
                  <div className="review-sub-scores">
                    <div className="sub-score-pill">
                      <span className="sub-score-value">
                        {s.scoreDetail.subScores.brandAccuracy}
                      </span>
                      <span className="sub-score-name">Brand</span>
                    </div>
                    <div className="sub-score-pill">
                      <span className="sub-score-value">
                        {s.scoreDetail.subScores.quantityAccuracy}
                      </span>
                      <span className="sub-score-name">Quantity</span>
                    </div>
                    <div className="sub-score-pill">
                      <span className="sub-score-value">
                        {s.scoreDetail.subScores.positionAccuracy}
                      </span>
                      <span className="sub-score-name">Position</span>
                    </div>
                    <div className="sub-score-pill">
                      <span className="sub-score-value">
                        {s.scoreDetail.subScores.stockFullness}
                      </span>
                      <span className="sub-score-name">Fullness</span>
                    </div>
                  </div>
                </div>

                {/* Violations */}
                {s.scoreDetail.violations.length > 0 && (
                  <div className="review-violations">
                    <p className="review-violations-title">
                      Violations ({s.scoreDetail.violations.length})
                    </p>
                    {s.scoreDetail.violations.map((v, idx) => (
                      <div key={idx} className="violation-item">
                        <span className={`severity-badge ${severityClass(v.severity)}`}>
                          {v.severity}
                        </span>
                        <div className="violation-detail">
                          <span className="violation-location">
                            Shelf {v.shelf} — {v.section}
                          </span>
                          <span className="violation-diff">
                            Expected: {v.expected} / Found: {v.found}
                          </span>
                          <span className="violation-issue">{v.issue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: photo + info + actions */}
                <div className="review-card-footer">
                  <div className="review-photo-block">
                    <a href={resolveAssetUrl(s.photoUrl)} target="_blank" rel="noreferrer">
                      <img
                        className="review-photo-thumb"
                        src={resolveAssetUrl(s.photoUrl)}
                        alt="Submission photo"
                      />
                    </a>
                    <span className="review-photo-label">Click to enlarge</span>
                  </div>

                  <div className="review-footer-info">
                    <div className="review-planogram">
                      Planogram:{" "}
                      <strong>{s.planogramName ?? "Not specified"}</strong>
                    </div>
                    <div className="review-confidence">
                      AI confidence: {Math.round(s.scoreDetail.confidence * 100)}%
                    </div>
                    {s.scoreDetail.notes && (
                      <div className="review-ai-notes">{s.scoreDetail.notes}</div>
                    )}
                  </div>

                  <div className="review-actions">
                    <button
                      className="btn-confirm-issue"
                      onClick={() => handleAcknowledge(s.submissionId)}
                      disabled={!!dispute?.submitting}
                    >
                      Confirm Issue
                    </button>
                    {!dispute ? (
                      <button
                        className="btn-dismiss"
                        onClick={() => openDispute(s.submissionId)}
                      >
                        Dismiss — AI Error
                      </button>
                    ) : (
                      <button
                        className="btn-dismiss"
                        onClick={() => closeDispute(s.submissionId)}
                        disabled={dispute.submitting}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Dispute inline form */}
                {dispute && (
                  <form
                    className="dispute-form"
                    onSubmit={(e) => handleDispute(e, s.submissionId)}
                  >
                    <p className="dispute-form-title">Dispute AI Score</p>
                    <div className="dispute-form-row">
                      <div className="dispute-field" style={{ maxWidth: "160px" }}>
                        <label htmlFor={`score-${s.submissionId}`}>
                          Corrected Score (optional)
                        </label>
                        <input
                          id={`score-${s.submissionId}`}
                          type="number"
                          min={0}
                          max={100}
                          className="dispute-input"
                          value={dispute.correctedScore}
                          onChange={(e) =>
                            updateDispute(s.submissionId, { correctedScore: e.target.value })
                          }
                          placeholder="0–100"
                          disabled={dispute.submitting}
                        />
                      </div>
                      <div className="dispute-field">
                        <label htmlFor={`notes-${s.submissionId}`}>
                          Notes (required)
                        </label>
                        <textarea
                          id={`notes-${s.submissionId}`}
                          className="dispute-input dispute-textarea"
                          value={dispute.notes}
                          onChange={(e) =>
                            updateDispute(s.submissionId, { notes: e.target.value })
                          }
                          placeholder="Explain why the AI scoring was incorrect…"
                          required
                          disabled={dispute.submitting}
                        />
                      </div>
                    </div>
                    {dispute.error && (
                      <span className="dispute-error">{dispute.error}</span>
                    )}
                    <div className="dispute-form-actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => closeDispute(s.submissionId)}
                        disabled={dispute.submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={dispute.submitting}
                      >
                        {dispute.submitting ? "Submitting…" : "Submit Dispute"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
