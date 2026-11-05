import { API_URL } from "./api";

export interface StatisticsConference {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  startsAt: string;
}

export interface SessionStatistics {
  id: string;
  title: string;
  startsAt: string | null;
  roomName: string | null;
  capacity: number;
  reserved: number;
  available: number;
  occupancyPercent: number;
  waitlisted: number;
  scheduled: boolean;
}

export interface ConferenceStatisticsData {
  id: string;
  title: string;
  status: StatisticsConference["status"];
  capacity: number;
  registered: number;
  available: number;
  occupancyPercent: number;
  totalReserved: number;
  totalWaitlisted: number;
  sessions: SessionStatistics[];
}

async function statisticsRequest<T>(path: string): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/statistics${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error("Cannot connect to the server.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message : "Failed to load statistics.";
    throw new Error(message);
  }
  return data as T;
}

export const getStatisticsConferences = () => statisticsRequest<StatisticsConference[]>("/conferences");
export const getConferenceStatistics = (id: string) => statisticsRequest<ConferenceStatisticsData>(`/conferences/${encodeURIComponent(id)}`);
