import { useEscapeKey } from "../../hooks/useEscapeKey";
import { dismissOnBackdropClick } from "../../utils/dom";

export default function PhotoLightbox({
  url,
  name,
  onClose,
}: {
  url: string;
  name: string;
  onClose: () => void;
}) {
  useEscapeKey(onClose);
  const handleBackdropClick = dismissOnBackdropClick(onClose);

  return (
    <div
      className="dialog-backdrop photo-lightbox-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="photo-lightbox" role="dialog" aria-modal="true">
        <button
          className="photo-lightbox__close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <img src={url} alt={name} />
        <p className="photo-lightbox__caption">{name}</p>
      </div>
    </div>
  );
}
