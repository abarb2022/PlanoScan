import { apiRequest } from "./apiClient";
import type { FlaggedSubmission, ReviewRequest } from "../types/review";

const SUBMISSIONS_URL = "/api/manager/submissions";

export function getFlaggedSubmissions(companyId?: string | null): Promise<FlaggedSubmission[]> {
  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  const query = params.toString();
  return apiRequest<FlaggedSubmission[]>(
    `${SUBMISSIONS_URL}/flagged${query ? `?${query}` : ""}`,
  );
}

export function reviewSubmission(submissionId: string, request: ReviewRequest): Promise<null> {
  return apiRequest<null>(`${SUBMISSIONS_URL}/${submissionId}/review`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
