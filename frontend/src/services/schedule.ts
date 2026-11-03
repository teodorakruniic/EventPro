
const API_URL = "http://localhost:3001/api/schedule";

export interface Room {
  id: string;
  name: string;
  capacity: number;
  conferenceId: string;
  _count?: {
    talks: number;
  };
}

export interface ScheduledTalk {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  speakerId: string;
  conferenceId: string;
  roomId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  speaker: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  room: {
    id: string;
    name: string;
    capacity: number;
  } | null;
}

export interface ConferenceProgram {
  conference: {
    id: string;
    title: string;
    location: string;
    startsAt: string;
    endsAt: string;
  };
  talks: ScheduledTalk[];
}

export interface ScheduleInput {
  roomId: string;
  startsAt: string;
  endsAt: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Keep this token lookup consistent with AuthContext.
  const token =
    localStorage.getItem("token") ??
    sessionStorage.getItem("token") ??
    localStorage.getItem("eventpro_token") ??
    sessionStorage.getItem("eventpro_token");

  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.message ?? `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getManageRooms(
  conferenceId: string
): Promise<Room[]> {
  return request<Room[]>(
    `/manage/${encodeURIComponent(conferenceId)}/rooms`
  );
}

export function createRoom(
  conferenceId: string,
  data: { name: string; capacity: number }
): Promise<Room> {
  return request<Room>(
    `/conferences/${encodeURIComponent(conferenceId)}/rooms`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function deleteRoom(roomId: string): Promise<void> {
  return request<void>(
    `/rooms/${encodeURIComponent(roomId)}`,
    { method: "DELETE" }
  );
}

export function getManageTalks(
  conferenceId: string
): Promise<ScheduledTalk[]> {
  return request<ScheduledTalk[]>(
    `/manage/${encodeURIComponent(conferenceId)}/talks`
  );
}

export function scheduleTalk(
  talkId: string,
  data: ScheduleInput
): Promise<ScheduledTalk> {
  return request<ScheduledTalk>(
    `/talks/${encodeURIComponent(talkId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export function unscheduleTalk(
  talkId: string
): Promise<void> {
  return request<void>(
    `/talks/${encodeURIComponent(talkId)}`,
    { method: "DELETE" }
  );
}

export function getConferenceProgram(
  conferenceId: string
): Promise<ConferenceProgram> {
  return request<ConferenceProgram>(
    `/conferences/${encodeURIComponent(conferenceId)}/program`
  );
}
