// All calls go through /api, which Vite proxies to the Express server.
async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch {
    throw new Error("Cannot reach the server. Check that `npm start` is running in the server folder.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.errors ? data.errors.join(". ") : data.message || "Request failed");
  }
  return data;
}

export const api = {
  list: (month, category) =>
    request(`/api/expenses?month=${month}${category && category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}`),
  summary: (month) => request(`/api/summary?month=${month}`),
  create: (body) => request("/api/expenses", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/api/expenses/${id}`, { method: "DELETE" }),
};
