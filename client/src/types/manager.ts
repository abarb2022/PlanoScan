export interface Manager {
  id: string;
  name: string;
  surname: string | null;
  email: string;
  phone: string | null;
  companyId: string;
  companyName: string;
  createdAt: string | null;
}

export interface ManagerRequest {
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  companyId: string;
}

export interface ManagerPageResponse {
  content: Manager[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string | null;
}
