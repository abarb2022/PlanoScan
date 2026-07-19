import { apiRequest } from "./apiClient";
import type { Planogram, PlanogramRequest } from "../types/planogram";

const BASE = "/api/manager/planograms";

export function getPlanograms(page: number, size: number): Promise<Planogram[]> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequest<Planogram[]>(`${BASE}?${params.toString()}`);
}

export function createPlanogram(req: PlanogramRequest, image?: File | null): Promise<Planogram> {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(req)], { type: "application/json" }));
  if (image) formData.append("image", image);
  return apiRequest<Planogram>(BASE, { method: "POST", body: formData });
}

export function deletePlanogram(id: string): Promise<null> {
  return apiRequest<null>(`${BASE}/${id}`, { method: "DELETE" });
}
