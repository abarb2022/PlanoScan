export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  referenceImageUrl: string | null;
  companyId: string;
  companyName: string;
  createdAt: string | null;
}

export interface ProductRequest {
  name: string;
  sku?: string;
  description?: string;
  companyId?: string; // ADMIN only, managers auto-derive
}

export interface ProductPageResponse {
  content: Product[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}
