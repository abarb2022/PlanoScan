export type Store = {
  id: number;
  name: string;
  address: string | null;
  companyId: number;
  companyName: string;
  createdAt: string | null;
};

export type StoreForm = {
  name: string;
  address: string;
  companyId: string;
};

export type StoreRequest = {
  name: string;
  address: string;
  companyId: number;
};

export type StorePageResponse = {
  content: Store[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
};

export type StoreQuery = {
  page: number;
  size: number;
  companyId?: string;
};
