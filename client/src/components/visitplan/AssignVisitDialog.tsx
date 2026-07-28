import { FormEvent, useEffect, useState } from "react";
import type { Store } from "../../types/store";
import type { Rep } from "../../types/rep";
import { ALL_DAYS, DAY_LABELS, type DayOfWeek } from "../../types/assignmentRule";
import SearchableSelect from "../common/SearchableSelect";
import OptionalDateInput from "../common/OptionalDateInput";
import "../store/StoreDialog.css";
import "./VisitPlan.css";

interface Props {
  open: boolean;
  stores: Store[];
  reps: Rep[];
  onClose: () => void;
  onSubmit: (
    storeId: string,
    repId: string,
    days: DayOfWeek[],
    validFrom: string,
    validUntil?: string,
  ) => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function AssignVisitDialog({ open, stores, reps, onClose, onSubmit }: Props) {
  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState("");
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [validFrom, setValidFrom] = useState(today);
  const [validUntil, setValidUntil] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStoreId("");
      setRepId("");
      setDays([]);
      setValidFrom(today);
      setValidUntil("");
      setError("");
    }
  }, [open]);

  function toggleDay(day: DayOfWeek) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storeId) { setError("Please select an outlet."); return; }
    if (!repId) { setError("Please select a rep."); return; }
    if (days.length === 0) { setError("Please select at least one day."); return; }
    try {
      onSubmit(storeId, repId, days, validFrom, validUntil || undefined);
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to add assignment.");
    }
  }

  if (!open) return null;

  const storeOptions = stores.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.address,
  }));
  const repOptions = reps.map((r) => ({
    value: r.id,
    label: r.name,
    sublabel: r.email,
  }));

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog avd-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2 className="dialog-title">Assign Outlet</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className="dialog-error">{error}</p>}

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label className="dialog-label">Outlet</label>
            <SearchableSelect
              options={storeOptions}
              value={storeId}
              onChange={setStoreId}
              placeholder="Select an outlet"
              searchPlaceholder="Search outlets…"
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Rep</label>
            <SearchableSelect
              options={repOptions}
              value={repId}
              onChange={setRepId}
              placeholder="Select a rep"
              searchPlaceholder="Search reps…"
            />
          </div>

          <div className="dialog-field">
            <label className="dialog-label">Days of the Week</label>
            <div className="avd-days">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`vp-day-toggle${days.includes(day) ? " vp-day-toggle--on" : ""}`}
                  onClick={() => toggleDay(day)}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="avd-dates">
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
              <label className="dialog-label">
                Valid Until <span className="avd-optional">(optional)</span>
              </label>
              <OptionalDateInput
                value={validUntil || null}
                onChange={(value) => setValidUntil(value ?? "")}
                min={validFrom}
                inputClassName="dialog-input"
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
