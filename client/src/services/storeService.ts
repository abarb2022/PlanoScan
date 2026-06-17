import { apiRequest } from "./apiClient";
import type {
  Store,
  StorePageResponse,
  StoreQuery,
  StoreRequest,
} from "../types/store";

const STORE_URL = "/api/admin/stores";

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
