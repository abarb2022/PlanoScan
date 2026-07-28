import { apiRequest } from "./apiClient";
import type { ManagerDashboardResponse, ManagerRepWeekDetail } from "../types/dashboard";

export function getManagerDashboardOverview(
  weekStart: string,
  companyId?: string | null,
): Promise<ManagerDashboardResponse> {
  const params = new URLSearchParams();
  params.set("weekStart", weekStart);
  if (companyId) params.set("companyId", companyId);
  return apiRequest<ManagerDashboardResponse>(
    `/api/manager/dashboard/overview?${params.toString()}`,
  );
}

export function getManagerRepWeekDetail(
  repId: string,
  weekStart: string,
): Promise<ManagerRepWeekDetail> {
  const params = new URLSearchParams();
  params.set("weekStart", weekStart);
  return apiRequest<ManagerRepWeekDetail>(
    `/api/manager/dashboard/reps/${repId}?${params.toString()}`,
  );
}
