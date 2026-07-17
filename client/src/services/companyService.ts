import { apiRequest } from "./apiClient";
import type { Company } from "../types/manager";

const COMPANY_URL = "/api/admin/companies";

export function getCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>(COMPANY_URL);
}

export function createCompany(name: string): Promise<Company> {
  return apiRequest<Company>(COMPANY_URL, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateCompany(id: string, name: string): Promise<Company> {
  return apiRequest<Company>(`${COMPANY_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteCompany(id: string): Promise<null> {
  return apiRequest<null>(`${COMPANY_URL}/${id}`, { method: "DELETE" });
}
