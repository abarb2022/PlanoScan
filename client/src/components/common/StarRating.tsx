import "./StarRating.css";

interface Props {
  stars: number;
  size?: "sm" | "md" | "lg";
  score?: number;
  onClick?: (stars: number) => void;
  activeStars?: number | null;
}

export default function StarRating({ stars, size = "md", score, onClick, activeStars }: Props) {
  const clamped = Math.max(0, Math.min(5, Math.round(stars)));

  return (
    <span
      className={`star-rating star-rating-${size}`}
      title={score !== undefined ? `${score}/100` : `${clamped}/5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < clamped;
        const isActive = activeStars != null && i < activeStars;
        const className = `star ${filled ? "star-filled" : "star-empty"} ${isActive ? "star-active" : ""}`;

        return onClick ? (
          <button
            key={i}
            type="button"
            className={className}
            onClick={() => onClick(i + 1)}
            aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
          >
            ★
          </button>
        ) : (
          <span key={i} className={className}>★</span>
        );
      })}
    </span>
  );
}
