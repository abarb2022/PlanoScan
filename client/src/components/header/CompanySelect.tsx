import { useEffect, useRef, useState } from "react";
import type { Company } from "../../types/manager";
import "./CompanySelect.css";

interface Props {
  companies: Company[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export default function CompanySelect({ companies, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = companies.find((c) => c.id === value) ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div className="cs-root" ref={ref}>
      <button
        type="button"
        className={`cs-trigger${open ? " cs-trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cs-trigger__label">
          {selected ? selected.name : "All companies"}
        </span>
        <svg className="cs-trigger__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="cs-menu" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            className={`cs-option${value === null ? " cs-option--active" : ""}`}
            onClick={() => pick(null)}
          >
            All companies
          </button>
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={value === c.id}
              className={`cs-option${value === c.id ? " cs-option--active" : ""}`}
              onClick={() => pick(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
