import { apiRequest } from "./apiClient";
import type {
  Store,
  StorePageResponse,
  StoreQuery,
  StoreRequest,
  RepAssignmentPageResponse,
  RepAssignmentQuery,
  RepStoreAssignment,
} from "../types/store";

const STORE_URL = "/api/admin/stores";
const REP_ASSIGNMENTS_URL = "/api/rep/assignments";

export function getStores(query: StoreQuery): Promise<StorePageResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });

  if (query.companyId?.trim()) {
    params.set("companyId", query.companyId.trim());
  }

  return apiRequest<StorePageResponse>(`${STORE_URL}?${params.toString()}`);
}

export function createStore(store: StoreRequest): Promise<Store> {
  return apiRequest<Store>(STORE_URL, {
    method: "POST",
    body: JSON.stringify(store),
  });
}

export function updateStore(id: string, store: StoreRequest): Promise<Store> {
  return apiRequest<Store>(`${STORE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(store),
  });
}

export function deleteStore(id: string): Promise<null> {
  return apiRequest<null>(`${STORE_URL}/${id}`, { method: "DELETE" });
}

export function submitAssignment(
  assignmentId: string,
  photos: File[],
): Promise<RepStoreAssignment> {
  const formData = new FormData();
  photos.forEach((photo) => formData.append("photos", photo));

  return apiRequest<RepStoreAssignment>(
    `${REP_ASSIGNMENTS_URL}/${assignmentId}/submissions`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function getRepAssignments(
  query: RepAssignmentQuery,
): Promise<RepAssignmentPageResponse> {
  const params = new URLSearchParams({
    tab: query.tab,
    date: query.date,
    status: query.status,
    page: String(query.page),
    size: String(query.size),
  });

  if (query.storeName?.trim()) {
    params.set("storeName", query.storeName.trim());
  }

  return apiRequest<RepAssignmentPageResponse>(
    `${REP_ASSIGNMENTS_URL}?${params.toString()}`,
  );
}
