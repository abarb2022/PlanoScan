export interface AssignedStoreSummary {
  id: string;
  name: string;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  createdAt: string | null;
  assignedStores: AssignedStoreSummary[];
}

export interface RepRequest {
  name: string;
  email: string;
  companyId?: string;
}

export interface RepPageResponse {
  content: Rep[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}
