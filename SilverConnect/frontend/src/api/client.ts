const BASE = "http://localhost:3000";

export async function api(path: string, init?: RequestInit) {
  return fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
}
