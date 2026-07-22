import "./BackButton.css";

interface Props {
  label: string;
  onClick: () => void;
}

export default function BackButton({ label, onClick }: Props) {
  return (
    <button className="back-button" type="button" onClick={onClick}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
