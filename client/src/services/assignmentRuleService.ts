import { apiRequest } from "./apiClient";
import type { AssignmentRule, AssignmentRuleCompanySyncRequest } from "../types/assignmentRule";

export function getRulesForCompany(companyId?: string | null): Promise<AssignmentRule[]> {
  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  const qs = params.toString();
  return apiRequest<AssignmentRule[]>(
    `/api/manager/assignment-rules${qs ? `?${qs}` : ""}`,
  );
}

export function syncCompanyRules(
  req: AssignmentRuleCompanySyncRequest,
): Promise<AssignmentRule[]> {
  return apiRequest<AssignmentRule[]>("/api/manager/assignment-rules/sync", {
    method: "PUT",
    body: JSON.stringify(req),
  });
}
