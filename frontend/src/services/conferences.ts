import { API_URL } from "./api";

export type ConferenceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Conference {
  id: string;
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  startsAt: string;
  endsAt: string;
  status: ConferenceStatus;
  organizerId: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  organizer?: { id?: string; firstName: string; lastName: string; email?: string };
  _count?: { registrations: number };
}

export type ConferenceInput = Pick<Conference, "title" | "location" | "capacity" | "startsAt" | "endsAt"> & { description: string };

export interface ConferenceTalk {
  id: string;
  title: string;
  description: string;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
  startsAt: string | null;
  endsAt: string | null;
  speaker: { firstName: string; lastName: string };
  room: { name: string; capacity: number } | null;
}

export interface ConferenceDetails extends Conference {
  talks: ConferenceTalk[];
  _count: { registrations: number };
}

export interface ConferenceRegistrationStatus { registered: boolean }
export interface ConferenceRegistration { id: string; userId: string; conferenceId: string; createdAt: string }
export interface ConferenceRegistrationResponse { message: string; registration: ConferenceRegistration }
export interface ConferenceCancellationResponse { message: string }

export function conferenceImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith("/uploads/conferences/")) return null;
  return `${API_URL}${imageUrl}`;
}

export async function conferenceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");
  const headers = new Headers(options.headers);
  if (options.body != null && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/conferences${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot connect to the server.");
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message : "Request failed.";
    throw new Error(message);
  }
  return data as T;
}

export const getPublishedConferences = () => conferenceRequest<Conference[]>("");
export const getMyConferences = () => conferenceRequest<Conference[]>("/mine");
export const createConference = (data: ConferenceInput) => conferenceRequest<Conference>("", { method: "POST", body: JSON.stringify(data) });
export const updateConference = (id: string, data: ConferenceInput) => conferenceRequest<Conference>(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const publishConference = (id: string) => conferenceRequest<Conference>(`/${encodeURIComponent(id)}/publish`, { method: "PATCH" });
export const archiveConference = (id: string) => conferenceRequest<Conference>(`/${encodeURIComponent(id)}/archive`, { method: "PATCH" });
export const duplicateConference = (id: string) => conferenceRequest<Conference>(`/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
export const deleteConference = (id: string) => conferenceRequest<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getConferenceDetails = (id: string) => conferenceRequest<ConferenceDetails>(`/${encodeURIComponent(id)}`);
export const uploadConferenceImage = (id: string, image: File) => {
  const formData = new FormData();
  formData.append("image", image);
  return conferenceRequest<{ message: string; conference: Conference }>(`/${encodeURIComponent(id)}/image`, { method: "POST", body: formData });
};
export const deleteConferenceImage = (id: string) => conferenceRequest<{ message: string; conference: Conference }>(`/${encodeURIComponent(id)}/image`, { method: "DELETE" });
export const getConferenceRegistration = (id: string) => conferenceRequest<ConferenceRegistrationStatus>(`/${encodeURIComponent(id)}/registration`);
export const registerForConference = (id: string) => conferenceRequest<ConferenceRegistrationResponse>(`/${encodeURIComponent(id)}/register`, { method: "POST" });
export const cancelConferenceRegistration = (id: string) => conferenceRequest<ConferenceCancellationResponse>(`/${encodeURIComponent(id)}/registration`, { method: "DELETE" });
