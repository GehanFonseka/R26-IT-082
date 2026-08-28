import { apiRequest, clearAccessToken, setAccessToken } from "./apiClient";

const USER_KEY = "lti_current_user";

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};

export const updateStoredUser = (updates) => {
  const current = getStoredUser();
  if (!current) return null;
  const next = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
};

export const saveSession = ({ accessToken, user }) => {
  setAccessToken(accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (input) => saveSession((await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(input) })).data);
export const login = async (input) => saveSession((await apiRequest("/auth/login", { method: "POST", body: JSON.stringify(input) })).data);
export const logout = () => { clearAccessToken(); localStorage.removeItem(USER_KEY); };
