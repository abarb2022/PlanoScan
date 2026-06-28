import { apiRequest } from "./apiClient";
import type { Rep, RepPageResponse, RepRequest } from "../types/rep";
import type { Store } from "../types/store";

export function getReps(page = 0, size = 5): Promise<RepPageResponse> {
  return apiRequest<RepPageResponse>(
    `/api/manager/reps?page=${page}&size=${size}`,
  );
}

export function createRep(req: RepRequest): Promise<Rep> {
  return apiRequest<Rep>("/api/manager/reps", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function updateRep(id: string, req: RepRequest): Promise<Rep> {
  return apiRequest<Rep>(`/api/manager/reps/${id}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export function deleteRep(id: string): Promise<void> {
  return apiRequest<void>(`/api/manager/reps/${id}`, { method: "DELETE" });
}

export function getAvailableStores(): Promise<Store[]> {
  return apiRequest<Store[]>("/api/manager/reps/available-stores");
}
