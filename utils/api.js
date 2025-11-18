export async function apiFetch(endpoint, options = {}) {
  const baseUrl = "http://localhost/london-park/";
  
  // Merge default headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // If user is logged in, attach token
  const token = localStorage.getItem("user_token") || localStorage.getItem("admin_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(baseUrl + endpoint, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (res.status === 204) return null;

    const data = await res.json();

    if (!res.ok) {
      // You can customize error handling here
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (err) {
    console.error("API fetch error:", err);
    throw err;
  }
}