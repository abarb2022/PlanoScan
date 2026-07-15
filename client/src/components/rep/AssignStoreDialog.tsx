import { FormEvent, useEffect, useRef, useState } from "react";
import type { Store } from "../../types/store";
import { ALL_DAYS, DAY_LABELS, type DayOfWeek } from "../../types/assignmentRule";
import "../store/StoreDialog.css";
import "./AssignStoreDialog.css";

interface Props {
  open: boolean;
  repId: string;
  repName: string;
  stores: Store[];
  onClose: () => void;
  onSubmit: (storeId: string, days: DayOfWeek[], validFrom: string, validUntil?: string) => Promise<void>;
}

const today = new Date().toISOString().slice(0, 10);

export default function AssignStoreDialog({
  open, repId: _repId, repName, stores, onClose, onSubmit,
}: Props) {
  const [storeId, setStoreId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [validFrom, setValidFrom] = useState(today);
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStoreId("");
      setDropdownOpen(false);
      setDays([]);
      setValidFrom(today);
      setValidUntil("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [dropdownOpen]);

  function toggleDay(day: DayOfWeek) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storeId) { setError("Please select a store."); return; }
    if (days.length === 0) { setError("Please select at least one day."); return; }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(storeId, days, validFrom, validUntil || undefined);
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to assign store.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog asd-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">Assign Store</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="asd-rep-label">Rep: <strong>{repName}</strong></p>

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Store</label>
            <div className="asd-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`asd-dropdown-trigger dialog-input${dropdownOpen ? " asd-dropdown-trigger--open" : ""}`}
                onClick={() => setDropdownOpen((o) => !o)}
              >
                <span className={storeId ? "" : "asd-dropdown-placeholder"}>
                  {stores.find((s) => s.id === storeId)?.name ?? "Select a store"}
                </span>
                <svg className="asd-dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="asd-dropdown-menu">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`asd-dropdown-option${s.id === storeId ? " asd-dropdown-option--selected" : ""}`}
                      onClick={() => { setStoreId(s.id); setDropdownOpen(false); }}
                    >
                      <span className="asd-option-name">{s.name}</span>
                      {s.address && <span className="asd-option-address">{s.address}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Days of the Week</label>
            <div className="asd-days">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`asd-day-btn${days.includes(day) ? " asd-day-btn--on" : ""}`}
                  onClick={() => toggleDay(day)}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="asd-dates">
            <div className="dialog-field">
              <label className="dialog-label">Valid From</label>
              <input
                className="dialog-input"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="dialog-field">
              <label className="dialog-label">Valid Until <span className="asd-optional">(optional)</span></label>
              <input
                className="dialog-input"
                type="date"
                value={validUntil}
                min={validFrom}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Assigning…" : "Assign Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
