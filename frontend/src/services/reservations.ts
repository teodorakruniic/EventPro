
const API_URL = "http://localhost:3001/api/reservations";

export interface Reservation {
  id: string;
  userId: string;
  talkId: string;
  createdAt: string;
  talk: {
    id: string;
    title: string;
    description: string;
    startsAt: string | null;
    endsAt: string | null;
    room: {
      id: string;
      name: string;
      capacity: number;
    } | null;
    speaker: {
      id: string;
      firstName: string;
      lastName: string;
    };
    conference: {
      id: string;
      title: string;
      location: string;
      startsAt: string;
      endsAt: string;
      status: string;
    };
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");

  const headers = new Headers(options.headers);

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

export function getMyReservations(): Promise<Reservation[]> {
  return request<Reservation[]>("/my");
}

export function getConferenceReservations(
  conferenceId: string
): Promise<{ talkIds: string[] }> {
  return request<{ talkIds: string[] }>(
    `/conferences/${encodeURIComponent(conferenceId)}`
  );
}

export function reserveTalk(talkId: string): Promise<unknown> {
  return request(
    `/talks/${encodeURIComponent(talkId)}`,
    { method: "POST" }
  );
}

export function cancelReservation(
  talkId: string
): Promise<void> {
  return request<void>(
    `/talks/${encodeURIComponent(talkId)}`,
    { method: "DELETE" }
  );
}
