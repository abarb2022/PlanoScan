import { resolveAssetUrl } from "../../services/apiClient";
import type { RepSubmission } from "../../types/store";

function submissionStatusClass(status: string) {
  return status.toLowerCase();
}

export default function SubmissionsPanel({
  submissions,
  onViewPhoto,
}: {
  submissions: RepSubmission[];
  onViewPhoto: (photo: { url: string; name: string }) => void;
}) {
  return (
    <div className="submissions-panel">
      <div className="panel-title-row">
        <h3>Submissions</h3>
        <span>{submissions.length}</span>
      </div>
      {submissions.length === 0 ? (
        <p className="empty-note">No submissions have been made yet.</p>
      ) : (
        <div className="submission-list">
          {submissions.map((submission) => (
            <button
              type="button"
              className="submission-item"
              key={submission.id}
              onClick={() =>
                onViewPhoto({
                  url: resolveAssetUrl(submission.photoUrl),
                  name: submission.photoName,
                })
              }
              aria-label={`View ${submission.photoName}`}
              title={`View ${submission.photoName}`}
            >
              <div className="submission-item__main">
                <span className="submission-thumb">
                  <img src={resolveAssetUrl(submission.photoUrl)} alt="" />
                </span>
                <div>
                  <strong>{submission.photoName}</strong>
                  <span>{submission.submittedAt}</span>
                  {submission.planogramName && (
                    <span className="submission-planogram">
                      {submission.planogramName}
                    </span>
                  )}
                </div>
              </div>
              <div className="submission-meta">
                <span
                  className={`submission-status-badge submission-status-${submissionStatusClass(
                    submission.status,
                  )}`}
                >
                  {submission.status}
                </span>
                {submission.score && <strong>{submission.score}</strong>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
