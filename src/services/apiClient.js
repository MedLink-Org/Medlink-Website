import { clearAccessToken, getAccessToken } from "./tokenStorage";

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

function getErrorMessage(payload, status) {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    return payload.message || payload.error || `Request failed with status ${status}.`;
  }
  return `Request failed with status ${status}.`;
}

export async function request(path, options = {}) {
  const { body, headers, ...requestOptions } = options;
  const accessToken = getAccessToken();
  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && accessToken) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("medlink:unauthorized"));
      }
    }
    const error = new Error(getErrorMessage(payload, response.status));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
}

export function asCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}
