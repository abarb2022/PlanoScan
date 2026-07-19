import { apiRequest } from "./apiClient";
import type { Product, ProductPageResponse } from "../types/product";

const PRODUCT_URL = "/api/manager/products";

export function getProducts(
  page: number,
  size: number,
  companyId?: string | null,
): Promise<ProductPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (companyId) params.set("companyId", companyId);
  return apiRequest<ProductPageResponse>(`${PRODUCT_URL}?${params.toString()}`);
}

export function createProduct(formData: FormData): Promise<Product> {
  return apiRequest<Product>(PRODUCT_URL, {
    method: "POST",
    body: formData,
  });
}

export function updateProduct(id: string, formData: FormData): Promise<Product> {
  return apiRequest<Product>(`${PRODUCT_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export function deleteProduct(id: string): Promise<null> {
  return apiRequest<null>(`${PRODUCT_URL}/${id}`, { method: "DELETE" });
}
