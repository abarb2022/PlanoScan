export interface AssignedStoreSummary {
  id: string;
  name: string;
}

export interface Rep {
  id: string;
  name: string;
  surname: string | null;
  email: string;
  phone: string | null;
  companyId: string;
  companyName: string;
  createdAt: string | null;
  assignedStores: AssignedStoreSummary[];
}

export interface RepRequest {
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  companyId?: string;
}

export interface RepPageResponse {
  content: Rep[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}
