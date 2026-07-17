import { apiRequest } from "./apiClient";
import type { AssignmentRule, AssignmentRuleRequest } from "../types/assignmentRule";

export function getRulesForRep(repId: string): Promise<AssignmentRule[]> {
  return apiRequest<AssignmentRule[]>(
    `/api/manager/assignment-rules?repId=${repId}`,
  );
}

export function createRules(req: AssignmentRuleRequest): Promise<AssignmentRule[]> {
  return apiRequest<AssignmentRule[]>("/api/manager/assignment-rules", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function deleteRule(id: string): Promise<void> {
  return apiRequest<void>(`/api/manager/assignment-rules/${id}`, {
    method: "DELETE",
  });
}
