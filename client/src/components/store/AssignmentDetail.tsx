import { useEffect, useState } from "react";
import { ApiError } from "../../services/apiClient";
import { submitAssignment } from "../../services/storeService";
import type {
  RepAssignmentStatus,
  RepStoreAssignment,
} from "../../types/store";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { dismissOnBackdropClick } from "../../utils/dom";
import PhotoUploadPanel from "./PhotoUploadPanel";
import SubmissionsPanel from "./SubmissionsPanel";
import PhotoLightbox from "./PhotoLightbox";

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
  onSubmitted,
}: {
  assignment: RepStoreAssignment;
  onSubmitted: (updated: RepStoreAssignment) => void;
}) {
  const canSubmit = assignment.status === "DUE_TODAY";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<{
    url: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    setSelectedFiles([]);
    setError("");
  }, [assignment.id]);

  useEscapeKey(() => setIsFullscreen(false), isFullscreen);
  const handleBackdropClick = dismissOnBackdropClick(() =>
    setIsFullscreen(false),
  );

  const submitHint =
    canSubmit && !submitting && selectedFiles.length === 0
      ? "Choose at least one photo to enable submission."
      : null;

  async function handleSubmit() {
    if (selectedFiles.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await submitAssignment(assignment.id, selectedFiles);
      onSubmitted(updated);
      setSelectedFiles([]);
      setIsFullscreen(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        setError(
          "One or more photos couldn't be uploaded — try a JPEG or PNG photo, or use the in-app camera.",
        );
      } else {
        setError("Failed to submit assignment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <>
      <div className="assignment-detail-header">
        <div>
          <p className="detail-eyebrow">{assignment.assignmentDate}</p>
          <h2>{assignment.store.name}</h2>
          <p>{assignment.store.address}</p>
        </div>
        <div className="assignment-detail-header-actions">
          <span
            className={`status-badge status-${assignmentStatusClass(
              assignment.status,
            )}`}
          >
            {assignmentStatusLabel(assignment.status)}
          </span>
          <button
            className="assignment-expand-btn"
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? "Exit fullscreen" : "Expand fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Expand fullscreen"}
          >
            {isFullscreen ? "⤡" : "⤢"}
          </button>
        </div>
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
      </div>

      <PhotoUploadPanel
        canSubmit={canSubmit}
        submitting={submitting}
        error={error}
        selectedFiles={selectedFiles}
        onFilesChange={setSelectedFiles}
        onViewPhoto={setViewingPhoto}
        onSubmit={handleSubmit}
        submitHint={submitHint}
      />

      <SubmissionsPanel
        submissions={assignment.submissions}
        onViewPhoto={setViewingPhoto}
      />

      {viewingPhoto && (
        <PhotoLightbox
          url={viewingPhoto.url}
          name={viewingPhoto.name}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </>
  );

  if (isFullscreen) {
    return (
      <div
        className="dialog-backdrop assignment-fullscreen-backdrop"
        onClick={handleBackdropClick}
      >
        <aside
          className="assignment-detail assignment-detail-fullscreen"
          aria-label="Assignment details"
        >
          {content}
        </aside>
      </div>
    );
  }

  return (
    <aside className="assignment-detail" aria-label="Assignment details">
      {content}
    </aside>
  );
}
