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

export type RepAssignmentStatus =
  | "DUE_TODAY"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "MISSED"
  | "CANCELLED";

export type RepDateFilter = "all" | "today" | "yesterday" | "older";
export type RepStatusFilter = "all" | RepAssignmentStatus;
export type RepAssignmentTab = "active" | "history";

export type RepSubmission = {
  id: string;
  submittedAt: string;
  status: "Pending" | "Processing" | "Scored" | "Reviewed";
  score?: string | null;
  photoName: string;
  photoUrl: string;
  planogramName?: string | null;
};

export type RepStoreAssignment = {
  id: string;
  store: Pick<Store, "id" | "name" | "address" | "companyName">;
  assignmentDate: string;
  dueWindow: string;
  status: RepAssignmentStatus;
  lastSubmittedAt?: string | null;
  submissions: RepSubmission[];
};

export type RepAssignmentQuery = {
  tab: RepAssignmentTab;
  date: RepDateFilter;
  status: RepStatusFilter;
  company?: string;
  storeName?: string;
  page: number;
  size: number;
};

export type RepAssignmentPageResponse = {
  content: RepStoreAssignment[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
};
