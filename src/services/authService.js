import { request } from "./apiClient";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from "./tokenStorage";
import { normalizeRole, roleLabel } from "../auth/accessControl";

const AUTH_LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || "/api/auth/login";
const AUTH_SESSION_PATH = import.meta.env.VITE_AUTH_SESSION_PATH || "/api/auth/me";

function normalizeUser(payload) {
  if (!payload || typeof payload !== "object") return null;
  const user = payload.user ?? payload.profile ?? payload;
  const firstName = user.firstName ?? user.first_name ?? "";
  const lastName = user.lastName ?? user.last_name ?? "";
  const name = user.name
    ?? user.fullName
    ?? user.full_name
    ?? [firstName, lastName].filter(Boolean).join(" ")
    ?? "";

  if (!user.user_id && !user.id && !user.email && !name) return null;

  const role = normalizeRole(user.role ?? user.access_level);
  if (!role) return null;

  return {
    ...user,
    id: user.id ?? user.userId ?? user.user_id ?? "",
    profileId: user.profileId ?? user.profile_id ?? "",
    firstName,
    lastName,
    name,
    email: user.email ?? "",
    picture: user.picture ?? user.avatar_url ?? user.avatar ?? "",
    role,
    roleLabel: roleLabel(role)
  };
}

async function authenticate(path, email, password, options = {}) {
  const payload = await request(path, {
    ...options,
    method: "POST",
    body: { email, password }
  });
  const accessToken = payload?.access_token;
  const user = normalizeUser(payload?.user);

  if (!accessToken || !user) {
    throw new Error("The backend did not return a valid MedLink session.");
  }

  setAccessToken(accessToken);
  return {
    accessToken,
    expiresIn: payload.expires_in,
    tokenType: payload.token_type || "Bearer",
    user
  };
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function signIn(email, password, options = {}) {
  return authenticate(AUTH_LOGIN_PATH, email, password, options);
}

export async function getCurrentUser(options = {}) {
  if (!hasAccessToken()) return null;
  return normalizeUser(await request(AUTH_SESSION_PATH, options));
}

export function logout() {
  clearAccessToken();
}
