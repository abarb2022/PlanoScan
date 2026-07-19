import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getUpcomingAssignments } from "../../services/storeService";
import type { RepUpcomingAssignment } from "../../types/store";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { dismissOnBackdropClick } from "../../utils/dom";
import "./StoreDialog.css";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MAX_VISIBLE_CHIPS = 2;

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function workloadBackground(count: number): string {
  const alpha = Math.min(0.14 + (count - 1) * 0.13, 0.58);
  const secondaryAlpha = alpha * 0.65;
  return `linear-gradient(155deg, rgba(79, 110, 247, ${alpha}) 0%, rgba(124, 58, 237, ${secondaryAlpha}) 100%)`;
}

function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function RepCalendar() {
  const today = new Date();
  const todayIso = toIsoDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [occurrencesByDate, setOccurrencesByDate] = useState<
    Record<string, RepUpcomingAssignment["store"][]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const monthCacheRef = useRef(
    new Map<string, Record<string, RepUpcomingAssignment["store"][]>>(),
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  useEscapeKey(() => setOpenDay(null), openDay !== null);
  const handleBackdropClick = dismissOnBackdropClick(() => setOpenDay(null));

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function recalculate() {
      if (!grid) return;
      const height = grid.clientHeight;
      if (height === 0) return;
      const rowGap = parseFloat(getComputedStyle(grid).rowGap) || 0;

      const availableHeight = height - rowGap * 5;
      setRowHeight(Math.max(48, Math.floor(availableHeight / 6)));
    }

    recalculate();
    const observer = new ResizeObserver(recalculate);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadMonth();
    setOpenDay(null);
  }, [year, month]);

  async function loadMonth() {
    const cacheKey = `${year}-${month}`;
    const cached = monthCacheRef.current.get(cacheKey);
    if (cached) {
      setError("");
      setOccurrencesByDate(cached);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const from = toIsoDate(year, month, 1);
      const to = toIsoDate(year, month, daysInMonth);
      const occurrences = await getUpcomingAssignments(from, to);

      const grouped: Record<string, RepUpcomingAssignment["store"][]> = {};
      occurrences.forEach((occurrence) => {
        (grouped[occurrence.date] ??= []).push(occurrence.store);
      });
      monthCacheRef.current.set(cacheKey, grouped);
      setOccurrencesByDate(grouped);
    } catch {
      setError("Failed to load upcoming assignments.");
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const cells = buildMonthGrid(year, month);
  const rowCount = cells.length / 7;
  const openDayStores = openDay ? (occurrencesByDate[openDay] ?? []) : [];

  return (
    <div className="rep-calendar">
      <div className="rep-calendar-header">
        <button
          type="button"
          className="rep-calendar-nav"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2>
          {MONTH_LABELS[month]} {year}
        </h2>
        <button
          type="button"
          className="rep-calendar-nav"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="rep-calendar-legend">
        <span className="rep-calendar-legend-swatch" />
        Darker days mean more assigned visits
      </div>

      <div className="rep-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="rep-calendar-weekday">
            {label}
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        className={`rep-calendar-grid ${loading ? "is-loading" : ""}`}
        style={{
          gridTemplateRows: `repeat(${rowCount}, ${
            rowHeight !== null ? `${rowHeight}px` : "minmax(48px, 1fr)"
          })`,
        }}
      >
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="rep-calendar-cell rep-calendar-cell-empty"
              />
            );
          }

          const iso = toIsoDate(year, month, day);
          const stores = occurrencesByDate[iso] ?? [];
          const isToday = iso === todayIso;
          const isPast = iso < todayIso;
          const hasAssignment = stores.length > 0;
          const visibleStores = stores.slice(0, MAX_VISIBLE_CHIPS);
          const extraCount = stores.length - visibleStores.length;

          return (
            <div
              key={iso}
              className={`rep-calendar-cell ${isToday ? "is-today" : ""} ${
                isPast ? "is-past" : ""
              } ${hasAssignment ? "has-assignment" : ""}`}
              style={
                hasAssignment
                  ? { backgroundImage: workloadBackground(stores.length) }
                  : undefined
              }
              onClick={() => hasAssignment && setOpenDay(iso)}
            >
              <span className="rep-calendar-day-number">{day}</span>

              {hasAssignment && (
                <div className="rep-calendar-chips">
                  {visibleStores.map((store, i) => (
                    <span className="rep-calendar-chip" key={i}>
                      <span className="rep-calendar-chip-icon">
                        {store.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="rep-calendar-chip-label">
                        {store.name}
                      </span>
                    </span>
                  ))}
                  {extraCount > 0 && (
                    <span className="rep-calendar-chip rep-calendar-chip-more">
                      +{extraCount} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openDay && (
        <div className="dialog-backdrop" onClick={handleBackdropClick}>
          <div
            className="dialog rep-calendar-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="dialog-header">
              <h2 className="dialog-title">{formatFullDate(openDay)}</h2>
              <button
                className="dialog-close"
                onClick={() => setOpenDay(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="rep-calendar-dialog-list">
              {openDayStores.map((store, i) => (
                <div className="rep-calendar-dialog-item" key={i}>
                  <div className="rep-calendar-dialog-item-icon">
                    {store.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="rep-calendar-dialog-item-body">
                    <strong>{store.name}</strong>
                    <span>{store.address ?? "No address"}</span>
                    <span className="rep-calendar-dialog-item-company">
                      {store.companyName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
