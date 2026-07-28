import "./OptionalDateInput.css";

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  inputClassName?: string;
}

export default function OptionalDateInput({ value, onChange, min, inputClassName }: Props) {
  if (!value) {
    return (
      <button
        type="button"
        className="optional-date-add"
        onClick={() => onChange(min ?? new Date().toISOString().slice(0, 10))}
      >
        + Add end date
      </button>
    );
  }

  return (
    <div className="optional-date-wrap">
      <input
        type="date"
        className={inputClassName}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="optional-date-clear"
        onClick={() => onChange(null)}
        aria-label="Remove end date"
        title="Remove end date"
      >
        ✕
      </button>
    </div>
  );
}
