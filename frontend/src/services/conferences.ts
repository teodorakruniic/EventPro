
import { API_URL } from "./api";

export type ConferenceStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export interface Conference {
  id: string;
  title: string;
  description: string | null;
  location: string;
  startsAt: string;
  endsAt: string;
  status: ConferenceStatus;
  organizerId: string;
  organizer?: {
    firstName: string;
    lastName: string;
  };
}

export type ConferenceInput = Pick<
  Conference,
  "title" | "location" | "startsAt" | "endsAt"
> & {
  description: string;
};

// Conference sessions
export interface ConferenceTalk {
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  speaker: {
    firstName: string;
    lastName: string;
  };
  room: {
    name: string;
    capacity: number;
  } | null;
}

// Detailed conference response
export interface ConferenceDetails extends Conference {
  talks: ConferenceTalk[];
  _count: {
    registrations: number;
  };
}

// Registration status
export interface ConferenceRegistrationStatus {
  registered: boolean;
}

// Shared API request helper
export async function conferenceRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/conferences${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Cannot connect to the server.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed.";

    throw new Error(message);
  }

  return data as T;
}

// Get all published conferences
export const getPublishedConferences = () =>
  conferenceRequest<Conference[]>("");

// Get conferences owned by the organizer
export const getMyConferences = () =>
  conferenceRequest<Conference[]>("/mine");

// Create a conference
export const createConference = (data: ConferenceInput) =>
  conferenceRequest<Conference>("", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Update a draft conference
export const updateConference = (
  id: string,
  data: ConferenceInput
) =>
  conferenceRequest<Conference>(
    `/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

// Publish a conference
export const publishConference = (id: string) =>
  conferenceRequest<Conference>(
    `/${encodeURIComponent(id)}/publish`,
    {
      method: "PATCH",
    }
  );

// Delete a draft conference
export const deleteConference = (id: string) =>
  conferenceRequest<void>(
    `/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

// Get conference details and accepted talks
export const getConferenceDetails = (id: string) =>
  conferenceRequest<ConferenceDetails>(
    `/${encodeURIComponent(id)}`
  );

// Check whether the current user is registered
export const getConferenceRegistration = (id: string) =>
  conferenceRequest<ConferenceRegistrationStatus>(
    `/${encodeURIComponent(id)}/registration`
  );

// Register the current user for a conference
export const registerForConference = (id: string) =>
  conferenceRequest<{
    message: string;
    registration: {
      id: string;
      userId: string;
      conferenceId: string;
      createdAt: string;
    };
  }>(
    `/${encodeURIComponent(id)}/register`,
    {
      method: "POST",
    }
  );
