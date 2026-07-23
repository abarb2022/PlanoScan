import type { ScoreDetail } from "./review";

export type SubmissionStatus = "PENDING" | "PROCESSING" | "SCORED" | "REVIEWED";

export interface SubmissionSummary {
  id: string;
  repId: string;
  repName: string;
  storeId: string;
  storeName: string;
  planogramName: string | null;
  photoUrl: string;
  overallScore: number;
  stars: number;
  status: SubmissionStatus;
  flaggedForReview: boolean;
  submittedAt: string;
}

export interface SubmissionDetail {
  id: string;
  repName: string;
  repEmail: string;
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  assignmentDate: string | null;
  submittedAt: string;
  photoUrl: string;
  planogramName: string | null;
  overallScore: number;
  stars: number;
  status: SubmissionStatus;
  flaggedForReview: boolean;
  scoreDetail: ScoreDetail;
}

export interface SubmissionPageResponse {
  content: SubmissionSummary[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export interface SubmissionQuery {
  page: number;
  size: number;
  companyId?: string | null;
  storeId?: string | null;
  repId?: string | null;
  stars?: number | null;
}
