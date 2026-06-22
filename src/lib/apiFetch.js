import { authClient } from "./auth-client";

/**
 * Custom fetch wrapper that automatically attaches the JWT Bearer token
 * to every request made to the backend API.
 */
export const apiFetch = async (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  
  try {
    // get token from better-auth jwtClient plugin
    const { data, error } = await authClient.token();
    if (data?.token) {
      headers.set("Authorization", `Bearer ${data.token}`);
    } else if (error) {
      console.warn("Failed to get JWT token:", error);
    }
  } catch (err) {
    console.warn("Error getting JWT token:", err);
  }

  // Ensure content-type is json if not sending FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config = {
    ...options,
    headers,
    credentials: "include" // keep cookie fallback active
  };

  return fetch(url, config);
};
