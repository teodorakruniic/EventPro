
export const API_URL = "http://localhost:3001";

export type UserRole = "ORGANIZER" | "SPEAKER" | "ATTENDEE";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export async function authRequest(
  endpoint: string,
  data: Record<string, string>
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Authentication failed.");
  }

  return result as AuthResponse;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Request failed.";

    throw new Error(message);
  }

  return result as T;
}

export function getAvatarUrl(
  avatarUrl?: string | null
): string | null {
  if (!avatarUrl) return null;

  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://")
  ) {
    return avatarUrl;
  }

  return `${API_URL}${avatarUrl}`;
}
