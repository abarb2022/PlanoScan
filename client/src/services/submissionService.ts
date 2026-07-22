import { apiRequest } from "./apiClient";
import type { SubmissionDetail, SubmissionPageResponse, SubmissionQuery } from "../types/submission";

const BASE = "/api/manager/submissions";

export function getSubmissions(query: SubmissionQuery): Promise<SubmissionPageResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });
  if (query.companyId) params.set("companyId", query.companyId);
  if (query.storeId) params.set("storeId", query.storeId);
  if (query.repId) params.set("repId", query.repId);
  if (query.stars !== null && query.stars !== undefined) params.set("stars", String(query.stars));

  return apiRequest<SubmissionPageResponse>(`${BASE}?${params.toString()}`);
}

export function getSubmission(id: string): Promise<SubmissionDetail> {
  return apiRequest<SubmissionDetail>(`${BASE}/${id}`);
}
