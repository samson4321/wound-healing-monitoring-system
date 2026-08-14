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