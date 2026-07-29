export interface Product {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  description: string | null;
  referenceImageUrl: string | null;
  companyId: string;
  companyName: string;
  createdAt: string | null;
}

export interface ProductRequest {
  name: string;
  code?: string;
  category?: string;
  description?: string;
  companyId?: string; // ADMIN only, managers auto-derive
}

export interface ProductPageResponse {
  content: Product[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}
