
export const API_URL = "http://localhost:3001";

export type UserRole = "ORGANIZER" | "SPEAKER" | "ATTENDEE";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
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
