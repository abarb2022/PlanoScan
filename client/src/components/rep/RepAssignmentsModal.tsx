import { useEffect, useState } from "react";
import {
  createRules,
  deleteRule,
  getRulesForRep,
} from "../../services/assignmentRuleService";
import { getAvailableStores } from "../../services/repService";
import type { AssignmentRule, DayOfWeek } from "../../types/assignmentRule";
import { ALL_DAYS, DAY_LABELS } from "../../types/assignmentRule";
import type { Rep } from "../../types/rep";
import type { Store } from "../../types/store";
import AssignStoreDialog from "./AssignStoreDialog";
import "./RepAssignmentsModal.css";

interface Props {
  rep: Rep;
  onClose: () => void;
}

export default function RepAssignmentsModal({ rep, onClose }: Props) {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    load();
  }, [rep.id]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [r, s] = await Promise.all([
        getRulesForRep(rep.id),
        getAvailableStores(),
      ]);
      setRules(r);
      setStores(s);
    } catch {
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(
    storeId: string,
    days: DayOfWeek[],
    validFrom: string,
    validUntil?: string,
  ) {
    const created = await createRules({
      storeId,
      repId: rep.id,
      days,
      validFrom,
      validUntil,
    });
    setRules((prev) => [...prev, ...created]);
  }

  async function handleDelete(ruleId: string) {
    if (!confirm("Remove this store assignment?")) return;
    try {
      await deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      setError("Failed to remove assignment.");
    }
  }

  // Group rules by day of week in order
  const byDay = ALL_DAYS.reduce<Record<DayOfWeek, AssignmentRule[]>>(
    (acc, day) => {
      acc[day] = rules.filter((r) => r.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayOfWeek, AssignmentRule[]>,
  );

  const activeDays = ALL_DAYS.filter((d) => byDay[d].length > 0);

  return (
    <>
      <div className="ram-backdrop" onClick={onClose}>
        <div
          className="ram-panel"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="ram-header">
            <div>
              <h2 className="ram-title">Store Assignments</h2>
              <p className="ram-rep">{rep.name} · {rep.email}</p>
            </div>
            <div className="ram-header-actions">
              <button
                className="btn btn-primary"
                onClick={() => setAssignOpen(true)}
              >
                <span>＋</span> Assign Store
              </button>
              <button className="ram-close" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          {error && <p className="ram-error">{error}</p>}

          <div className="ram-body">
            {loading ? (
              <div className="ram-state">
                <span className="spinner" /> Loading…
              </div>
            ) : rules.length === 0 ? (
              <div className="ram-empty">
                <p className="ram-empty-title">No stores assigned yet</p>
                <p className="ram-empty-sub">
                  Click "Assign Store" to add a recurring weekly visit.
                </p>
              </div>
            ) : (
              <div className="ram-days">
                {activeDays.map((day) => (
                  <div key={day} className="ram-day-block">
                    <div className="ram-day-label">{DAY_LABELS[day]}</div>
                    <div className="ram-day-rules">
                      {byDay[day].map((rule) => (
                        <div key={rule.id} className="ram-rule">
                          <div className="ram-rule-info">
                            <div className="ram-rule-store">{rule.storeName}</div>
                            {rule.storeAddress && (
                              <div className="ram-rule-address">{rule.storeAddress}</div>
                            )}
                            <div className="ram-rule-dates">
                              From {rule.validFrom}
                              {rule.validUntil ? ` → ${rule.validUntil}` : " · Open-ended"}
                            </div>
                          </div>
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Remove"
                            onClick={() => handleDelete(rule.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AssignStoreDialog
        open={assignOpen}
        repId={rep.id}
        repName={rep.name}
        stores={stores}
        onClose={() => setAssignOpen(false)}
        onSubmit={handleAssign}
      />
    </>
  );
}
