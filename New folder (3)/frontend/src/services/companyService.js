import { apiRequest } from "./apiClient";

export const listCompanyAdmins = async () => (await apiRequest("/company/admins")).data;
export const createCompanyAdmin = async (input) => (await apiRequest("/company/admins", {
  method: "POST", body: JSON.stringify(input),
})).data;
export const deleteCompanyAdmin = async (id) => (await apiRequest(`/company/admins/${encodeURIComponent(id)}`, {
  method: "DELETE",
})).data;
