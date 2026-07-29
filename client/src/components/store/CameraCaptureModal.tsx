import { useEffect, useRef, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { dismissOnBackdropClick } from "../../utils/dom";

const BLUR_VARIANCE_THRESHOLD = 130;
const BLUR_ANALYSIS_WIDTH = 480;

function computeBlurScore(canvas: HTMLCanvasElement): number {
  const scale = BLUR_ANALYSIS_WIDTH / canvas.width;
  const analysisWidth = BLUR_ANALYSIS_WIDTH;
  const analysisHeight = Math.max(1, Math.round(canvas.height * scale));

  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = analysisWidth;
  analysisCanvas.height = analysisHeight;
  const analysisContext = analysisCanvas.getContext("2d");
  if (!analysisContext) return Infinity;
  analysisContext.imageSmoothingEnabled = false;
  analysisContext.drawImage(canvas, 0, 0, analysisWidth, analysisHeight);

  const { data } = analysisContext.getImageData(
    0,
    0,
    analysisWidth,
    analysisHeight,
  );
  const gray = new Float32Array(analysisWidth * analysisHeight);
  for (let i = 0; i < gray.length; i++) {
    gray[i] =
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < analysisHeight - 1; y++) {
    for (let x = 1; x < analysisWidth - 1; x++) {
      const idx = y * analysisWidth + x;
      const laplacian =
        gray[idx - analysisWidth] +
        gray[idx + analysisWidth] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

export default function CameraCaptureModal({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const [cameraError, setCameraError] = useState("");
  const [pendingCapture, setPendingCapture] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEscapeKey(onClose);
  const handleBackdropClick = dismissOnBackdropClick(onClose);

  useEffect(() => {
    return () => {
      if (pendingCapture) URL.revokeObjectURL(pendingCapture.previewUrl);
    };
  }, [pendingCapture]);

  useEffect(() => {
    let cancelled = false;
    setCameraError("");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setCameraError("Unable to access the camera.");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blurScore = computeBlurScore(canvas);
    if (import.meta.env.DEV) {
      console.log(
        `[blur-check] score=${blurScore.toFixed(1)} threshold=${BLUR_VARIANCE_THRESHOLD}`,
      );
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        if (blurScore < BLUR_VARIANCE_THRESHOLD) {
          setPendingCapture({ file, previewUrl: URL.createObjectURL(blob) });
        } else {
          onCapture(file);
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleRetake() {
    if (pendingCapture) URL.revokeObjectURL(pendingCapture.previewUrl);
    setPendingCapture(null);
  }

  function handleUseAnyway() {
    if (!pendingCapture) return;
    onCapture(pendingCapture.file);
    URL.revokeObjectURL(pendingCapture.previewUrl);
    setPendingCapture(null);
  }

  return (
    <div
      className="dialog-backdrop camera-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="camera-modal" role="dialog" aria-modal="true">
        <button
          className="photo-lightbox__close"
          type="button"
          onClick={onClose}
          aria-label="Close camera"
        >
          ✕
        </button>
        <div className="camera-modal__video-wrapper">
          <video
            className="camera-modal__video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          {!pendingCapture && !cameraError && (
            <div className="camera-modal__frame-guide" aria-hidden="true">
              <div className="camera-modal__frame-guide-box" />
              <p className="camera-modal__frame-guide-hint">
                Center the refrigerator within the frame
              </p>
            </div>
          )}
          {pendingCapture && (
            <img
              className="camera-modal__preview-image"
              src={pendingCapture.previewUrl}
              alt="Captured refrigerator photo preview"
            />
          )}
          {cameraError && (
            <div className="camera-modal__error-overlay">
              <p className="upload-error">{cameraError}</p>
            </div>
          )}
        </div>
        {pendingCapture && (
          <p className="camera-modal__blur-warning" role="alert">
            This photo looks blurry. Retake for a sharper shot, or use it
            anyway.
          </p>
        )}
        <div className="camera-modal__actions">
          {pendingCapture ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRetake}
              >
                Retake
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUseAnyway}
              >
                Use Anyway
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!cameraError}
                onClick={handleCapture}
              >
                Capture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
