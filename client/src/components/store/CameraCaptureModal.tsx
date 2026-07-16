import { useEffect, useRef, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { dismissOnBackdropClick } from "../../utils/dom";

export default function CameraCaptureModal({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEscapeKey(onClose);
  const handleBackdropClick = dismissOnBackdropClick(onClose);

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

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(
          new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }),
        );
      },
      "image/jpeg",
      0.92,
    );
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
        {cameraError ? (
          <p className="upload-error">{cameraError}</p>
        ) : (
          <video
            className="camera-modal__video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
        )}
        <div className="camera-modal__actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
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
        </div>
      </div>
    </div>
  );
}
