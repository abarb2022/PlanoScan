import { apiRequest } from "./apiClient";
import type { Manager, ManagerPageResponse, ManagerRequest } from "../types/manager";

const MANAGER_URL = "/api/admin/managers";

export function getManagers(page: number, size: number, companyId?: string | null): Promise<ManagerPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (companyId) params.set("companyId", companyId);
  return apiRequest<ManagerPageResponse>(`${MANAGER_URL}?${params.toString()}`);
}

export function createManager(req: ManagerRequest): Promise<Manager> {
  return apiRequest<Manager>(MANAGER_URL, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function updateManager(id: string, req: ManagerRequest): Promise<Manager> {
  return apiRequest<Manager>(`${MANAGER_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export function deleteManager(id: string): Promise<null> {
  return apiRequest<null>(`${MANAGER_URL}/${id}`, { method: "DELETE" });
}
