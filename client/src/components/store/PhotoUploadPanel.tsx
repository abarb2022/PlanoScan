import { useEffect, useState } from "react";
import CameraCaptureModal from "./CameraCaptureModal";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function PhotoUploadPanel({
  canSubmit,
  submitting,
  error,
  selectedFiles,
  onFilesChange,
  onViewPhoto,
  onSubmit,
  submitHint,
}: {
  canSubmit: boolean;
  submitting: boolean;
  error: string;
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onViewPhoto: (photo: { url: string; name: string }) => void;
  onSubmit: () => void;
  submitHint: string | null;
}) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const next = selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    return () => next.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedFiles]);

  function addFiles(files: FileList | null) {
    const picked = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (picked.length > 0) {
      onFilesChange([...selectedFiles, ...picked]);
    }
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function removeSelectedFile(index: number) {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!canSubmit) return;
    addFiles(e.dataTransfer.files);
  }

  return (
    <div className="upload-panel">
      <div className="upload-panel__header">
        <div>
          <h3>Photo submission</h3>
          <p>upload photos for the selected assignment.</p>
        </div>
        {selectedFiles.length > 0 && (
          <span className="upload-pill">
            {selectedFiles.length} photo
            {selectedFiles.length > 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      <div className="upload-options">
        <div
          className={`upload-option upload-option--upload ${
            isDraggingOver ? "is-dragover" : ""
          } ${!canSubmit ? "is-disabled" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-option__icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="M7 8l5-5 5 5" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </div>
          <div className="upload-option__body">
            <strong>{isDraggingOver ? "Drop to add" : "Upload photos"}</strong>
            <span>Drag & drop, or browse your files.</span>
          </div>
          <label
            className={`upload-option__action ${!canSubmit ? "is-disabled" : ""}`}
          >
            Browse files
            <input
              disabled={!canSubmit}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
            />
          </label>
        </div>

        <div
          className={`upload-option upload-option--camera ${!canSubmit ? "is-disabled" : ""}`}
        >
          <div className="upload-option__icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
          <div className="upload-option__body">
            <strong>Take a photo</strong>
            <span>Use your device camera to capture the shelf.</span>
          </div>
          <button
            type="button"
            className="upload-option__action"
            disabled={!canSubmit}
            onClick={() => setIsCameraOpen(true)}
          >
            Open camera
          </button>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="upload-selected-grid">
          {previews.map((preview, index) => (
            <div className="upload-selected-item" key={preview.url}>
              <button
                type="button"
                className="upload-selected-preview"
                onClick={() =>
                  onViewPhoto({ url: preview.url, name: preview.file.name })
                }
                aria-label={`View ${preview.file.name}`}
                title={`View ${preview.file.name}`}
              >
                <img src={preview.url} alt="" />
              </button>
              <button
                type="button"
                className="upload-selected-remove"
                onClick={() => removeSelectedFile(index)}
                aria-label={`Remove ${preview.file.name}`}
                title={`Remove ${preview.file.name}`}
              >
                ✕
              </button>
              <span className="upload-selected-name">{preview.file.name}</span>
              <span className="upload-selected-size">
                {formatFileSize(preview.file.size)}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="upload-error">{error}</p>}

      <div className="upload-actions">
        <button
          className="btn btn-primary"
          disabled={!canSubmit || selectedFiles.length === 0 || submitting}
          type="button"
          onClick={onSubmit}
        >
          {submitting ? "Submitting…" : "Submit assignment"}
        </button>
        {submitHint && <span className="upload-hint">{submitHint}</span>}
      </div>

      {isCameraOpen && (
        <CameraCaptureModal
          onCapture={(file) => {
            onFilesChange([...selectedFiles, file]);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
