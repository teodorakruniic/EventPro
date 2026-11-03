
const API_URL = "http://localhost:3001/api/talks";

export type TalkStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Talk {
  id: string;
  title: string;
  description: string;
  status: TalkStatus;
  speakerId: string;
  conferenceId: string;
  roomId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  conference?: {
    id: string;
    title: string;
    location?: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
  };
  speaker?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  room?: {
    id: string;
    name: string;
  } | null;
}

export interface TalkProposalInput {
  title: string;
  description: string;
  conferenceId: string;
}

async function talkRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.message || `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getMyTalks(): Promise<Talk[]> {
  return talkRequest<Talk[]>("/my");
}

export function getConferenceTalks(
  conferenceId: string
): Promise<Talk[]> {
  return talkRequest<Talk[]>(
    `/conference/${encodeURIComponent(conferenceId)}`
  );
}

export function getReviewTalks(
  conferenceId: string
): Promise<Talk[]> {
  return talkRequest<Talk[]>(
    `/review/${encodeURIComponent(conferenceId)}`
  );
}

export function submitTalk(
  data: TalkProposalInput
): Promise<Talk> {
  return talkRequest<Talk>("", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTalk(
  id: string,
  data: Pick<TalkProposalInput, "title" | "description">
): Promise<Talk> {
  return talkRequest<Talk>(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function withdrawTalk(id: string): Promise<void> {
  return talkRequest<void>(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function reviewTalk(
  id: string,
  status: "ACCEPTED" | "REJECTED"
): Promise<Talk> {
  return talkRequest<Talk>(
    `/${encodeURIComponent(id)}/review`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}
