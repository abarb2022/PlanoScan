export type DashboardVisitStatus =
  | "PLANNED"
  | "DUE_TODAY"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export const DASHBOARD_STATUS_LABELS: Record<DashboardVisitStatus, string> = {
  PLANNED: "Planned",
  DUE_TODAY: "Due today",
  SUBMITTED: "Submitted",
  NEEDS_REVIEW: "Needs review",
  COMPLETED: "Completed",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

export interface DashboardTotals {
  outletsPlanned: number;
  outletsSubmitted: number;
  outletsMissed: number;
  outletsGraded: number;
  needsReview: number;
  avgScore: number | null;
}

export interface RepWeeklyStats {
  repId: string;
  repName: string;
  repEmail: string;
  totals: DashboardTotals;
  completionRate: number | null;
}

export interface ManagerDashboardResponse {
  weekStart: string;
  weekEnd: string;
  companyTotals: DashboardTotals;
  reps: RepWeeklyStats[];
}

export interface DashboardPhoto {
  submissionId: string;
  photoUrl: string;
  submittedAt: string | null;
}

export interface DashboardVisit {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  status: DashboardVisitStatus;
  score: number | null;
  stars: number | null;
  photos: DashboardPhoto[];
}

export interface DashboardDay {
  date: string;
  dayLabel: string;
  visits: DashboardVisit[];
}

export interface ManagerRepWeekDetail {
  repId: string;
  repName: string;
  repEmail: string;
  weekStart: string;
  weekEnd: string;
  totals: DashboardTotals;
  days: DashboardDay[];
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function mondayOf(date: Date): string {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return toIsoDate(monday);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const [sy, sm, sd] = weekStart.split("-").map(Number);
  const [ey, em, ed] = weekEnd.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel =
    sy === ey
      ? end.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}, ${ey}`;
}
