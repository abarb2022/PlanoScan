import { useEffect, useMemo, useState } from "react";
import { getRulesForCompany, syncCompanyRules } from "../../services/assignmentRuleService";
import { getAvailableStores, getReps } from "../../services/repService";
import type { AssignmentRule, DayOfWeek } from "../../types/assignmentRule";
import { ALL_DAYS, DAY_LABELS } from "../../types/assignmentRule";
import type { Rep } from "../../types/rep";
import type { Store } from "../../types/store";
import AssignVisitDialog from "./AssignVisitDialog";
import "../store/Stores.css";
import "./VisitPlan.css";

interface Props {
  companyId?: string | null;
}

type RowKey = string;

interface VisitRow {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  repId: string;
  repName: string;
  days: Set<DayOfWeek>;
  validFrom: string;
  validUntil: string | null;
  createdAt: string | null;
}

function rowKey(storeId: string, repId: string): RowKey {
  return `${storeId}::${repId}`;
}

function minString(a: string, b: string): string {
  return a < b ? a : b;
}

function rulesToRows(rules: AssignmentRule[]): Map<RowKey, VisitRow> {
  const map = new Map<RowKey, VisitRow>();
  for (const r of rules) {
    const k = rowKey(r.storeId, r.repId);
    const existing = map.get(k);
    if (existing) {
      existing.days.add(r.dayOfWeek);
      existing.validFrom = minString(existing.validFrom, r.validFrom);
      existing.validUntil =
        existing.validUntil === null || r.validUntil === null
          ? null
          : existing.validUntil > r.validUntil
            ? existing.validUntil
            : r.validUntil;
      if (r.createdAt && (!existing.createdAt || r.createdAt < existing.createdAt)) {
        existing.createdAt = r.createdAt;
      }
    } else {
      map.set(k, {
        storeId: r.storeId,
        storeName: r.storeName,
        storeAddress: r.storeAddress,
        repId: r.repId,
        repName: r.repName,
        days: new Set([r.dayOfWeek]),
        validFrom: r.validFrom,
        validUntil: r.validUntil,
        createdAt: r.createdAt,
      });
    }
  }
  return map;
}

function cloneRows(rows: Map<RowKey, VisitRow>): Map<RowKey, VisitRow> {
  const clone = new Map<RowKey, VisitRow>();
  for (const [k, row] of rows) clone.set(k, { ...row, days: new Set(row.days) });
  return clone;
}

function daysEqual(a: Set<DayOfWeek>, b: Set<DayOfWeek>): boolean {
  if (a.size !== b.size) return false;
  for (const d of a) if (!b.has(d)) return false;
  return true;
}

function rowDirty(a: VisitRow | undefined, b: VisitRow | undefined): boolean {
  const aDays = a?.days ?? new Set<DayOfWeek>();
  const bDays = b?.days ?? new Set<DayOfWeek>();
  if (!daysEqual(aDays, bDays)) return true;
  if ((a?.validFrom ?? null) !== (b?.validFrom ?? null)) return true;
  if ((a?.validUntil ?? null) !== (b?.validUntil ?? null)) return true;
  return false;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default function VisitPlan({ companyId }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [original, setOriginal] = useState<Map<RowKey, VisitRow>>(new Map());
  const [pending, setPending] = useState<Map<RowKey, VisitRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [dayFilters, setDayFilters] = useState<Set<DayOfWeek>>(new Set());

  useEffect(() => {
    load();
  }, [companyId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [rules, storeList, repRes] = await Promise.all([
        getRulesForCompany(companyId),
        getAvailableStores(),
        getReps(0, 500, companyId),
      ]);
      const rows = rulesToRows(rules);
      setOriginal(rows);
      setPending(cloneRows(rows));
      setStores(storeList);
      setReps(repRes.content);
    } catch {
      setError("Failed to load visit plan.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(key: RowKey, day: DayOfWeek) {
    setPending((prev) => {
      const next = cloneRows(prev);
      const row = next.get(key);
      if (!row) return prev;
      if (row.days.has(day)) row.days.delete(day);
      else row.days.add(day);
      return next;
    });
  }

  function updateRowDate(key: RowKey, field: "validFrom" | "validUntil", value: string) {
    setPending((prev) => {
      const next = cloneRows(prev);
      const row = next.get(key);
      if (!row) return prev;
      if (field === "validFrom") row.validFrom = value;
      else row.validUntil = value || null;
      return next;
    });
  }

  function removeRow(key: RowKey) {
    setPending((prev) => {
      const next = cloneRows(prev);
      const row = next.get(key);
      if (row) row.days.clear();
      return next;
    });
  }

  function addAssignment(
    storeId: string,
    repId: string,
    days: DayOfWeek[],
    validFrom: string,
    validUntil?: string,
  ) {
    const key = rowKey(storeId, repId);
    if (pending.has(key) && (pending.get(key)?.days.size ?? 0) > 0) {
      throw new Error("This outlet is already assigned to this rep — edit its row directly instead.");
    }
    const store = stores.find((s) => s.id === storeId);
    const rep = reps.find((r) => r.id === repId);
    if (!store || !rep) return;
    setPending((prev) => {
      const next = cloneRows(prev);
      next.set(key, {
        storeId,
        storeName: store.name,
        storeAddress: store.address,
        repId,
        repName: rep.name,
        days: new Set(days),
        validFrom,
        validUntil: validUntil ?? null,
        createdAt: next.get(key)?.createdAt ?? null,
      });
      return next;
    });
  }

  function toggleDayFilter(day: DayOfWeek) {
    setDayFilters((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const allRows = useMemo(
    () => Array.from(pending.values()).sort((a, b) => a.storeName.localeCompare(b.storeName)),
    [pending],
  );

  const filteredRows = useMemo(() => {
    if (dayFilters.size === 0) return allRows;
    return allRows.filter((row) => Array.from(row.days).some((d) => dayFilters.has(d)));
  }, [allRows, dayFilters]);

  const dirty = useMemo(() => {
    const keys = new Set([...original.keys(), ...pending.keys()]);
    for (const k of keys) {
      if (rowDirty(original.get(k), pending.get(k))) return true;
    }
    return false;
  }, [original, pending]);

  const dayCounts = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      MONDAY: 0,
      TUESDAY: 0,
      WEDNESDAY: 0,
      THURSDAY: 0,
      FRIDAY: 0,
      SATURDAY: 0,
      SUNDAY: 0,
    };
    for (const row of pending.values()) {
      for (const d of row.days) counts[d]++;
    }
    return counts;
  }, [pending]);

  const activeRowCount = useMemo(
    () => allRows.filter((r) => r.days.size > 0).length,
    [allRows],
  );

  async function handleSync() {
    try {
      setSyncing(true);
      setError("");
      const assignments = Array.from(pending.values()).map((row) => ({
        storeId: row.storeId,
        repId: row.repId,
        days: Array.from(row.days),
        validFrom: row.validFrom,
        validUntil: row.validUntil ?? undefined,
      }));
      const updated = await syncCompanyRules({ companyId, assignments });
      const rowsMap = rulesToRows(updated);
      setOriginal(rowsMap);
      setPending(cloneRows(rowsMap));
    } catch {
      setError("Failed to sync visit plan.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="visitplan-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Visit Plan</h1>
          {!loading && (
            <span className="stores-count">
              {activeRowCount} assignment{activeRowCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <span className={`vp-sync-badge${dirty ? " vp-sync-badge--dirty" : ""}`}>
            {dirty ? "Unsynced changes" : "Synced"}
          </span>
          <button className="btn btn-ghost" onClick={() => setAssignOpen(true)}>
            <span>＋</span> Assign
          </button>
          <button className="btn btn-primary" onClick={handleSync} disabled={!dirty || syncing}>
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      <div className="vp-daybar">
        {ALL_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={`vp-daybar-day${dayFilters.has(day) ? " vp-daybar-day--active" : ""}`}
            onClick={() => toggleDayFilter(day)}
            title={`Filter: ${DAY_LABELS[day]}`}
          >
            <span className="vp-daybar-count">{dayCounts[day]}</span>
            <span className="vp-daybar-daylabel">{DAY_LABELS[day]}</span>
          </button>
        ))}
        {dayFilters.size > 0 && (
          <button className="vp-daybar-clear" onClick={() => setDayFilters(new Set())}>
            Clear
          </button>
        )}
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper vp-table-wrapper">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Address</th>
              <th>Rep</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Created</th>
              <th>Assign</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-state">
                  <span className="spinner" /> Loading…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-state">
                  {allRows.length === 0
                    ? 'No assignments yet. Click "Assign" to add one.'
                    : "No assignments match the selected day filter."}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const key = rowKey(row.storeId, row.repId);
                return (
                  <tr key={key}>
                    <td className="vp-outlet-name">{row.storeName}</td>
                    <td className="vp-outlet-address">{row.storeAddress ?? "—"}</td>
                    <td>
                      <span className="company-badge">{row.repName}</span>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="vp-date-input"
                        value={row.validFrom}
                        onChange={(e) => updateRowDate(key, "validFrom", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="vp-date-input"
                        value={row.validUntil ?? ""}
                        min={row.validFrom}
                        onChange={(e) => updateRowDate(key, "validUntil", e.target.value)}
                      />
                    </td>
                    <td className="vp-created">{formatDate(row.createdAt)}</td>
                    <td>
                      <div className="vp-days">
                        {ALL_DAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            className={`vp-day-toggle${row.days.has(day) ? " vp-day-toggle--on" : ""}`}
                            onClick={() => toggleDay(key, day)}
                          >
                            {DAY_LABELS[day]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Remove"
                        onClick={() => removeRow(key)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AssignVisitDialog
        open={assignOpen}
        stores={stores}
        reps={reps}
        onClose={() => setAssignOpen(false)}
        onSubmit={addAssignment}
      />
    </div>
  );
}
