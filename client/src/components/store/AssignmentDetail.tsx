import type {
  RepAssignmentStatus,
  RepStoreAssignment,
} from "../../types/store";

const ASSIGNMENT_STATUS_LABELS: Record<RepAssignmentStatus, string> = {
  DUE_TODAY: "Due today",
  SUBMITTED: "Submitted",
  NEEDS_REVIEW: "Needs review",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

function assignmentStatusLabel(status: RepAssignmentStatus) {
  return ASSIGNMENT_STATUS_LABELS[status];
}

function assignmentStatusClass(status: RepAssignmentStatus) {
  return status.toLowerCase().replace(/_/g, "-");
}

export default function AssignmentDetail({
  assignment,
}: {
  assignment: RepStoreAssignment;
}) {
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
            <p>upload photo for the selected assignment.</p>
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
