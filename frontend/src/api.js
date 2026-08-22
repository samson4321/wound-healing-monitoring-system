
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export function getAuthToken() {
  return localStorage.getItem("authToken");
}

export function clearAuth() {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  localStorage.removeItem("firstName");
  localStorage.removeItem("authToken");
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}