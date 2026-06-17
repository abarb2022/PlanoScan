export type Store = {
  id: string;
  name: string;
  address: string | null;
  companyId: string;
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
  companyId: string;
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
