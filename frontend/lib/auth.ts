export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: "team_leader" | "admin" | "super_admin" | "document_reviewer";
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const isAuthenticated = (): boolean => !!getToken();

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === "admin" || user?.role === "super_admin";
};

export const redirectAfterLogin = (role: AuthUser["role"]): string => {
  if (role === "admin" || role === "super_admin") return "/admin";
  return "/event-selection";
};
