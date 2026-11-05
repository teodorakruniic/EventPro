import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import {
  getStatisticsConferences,
  getConferenceStatistics,
  type StatisticsConference,
  type ConferenceStatisticsData,
} from "../services/statistics";
import "./ConferenceStatistics.css";

export default function ConferenceStatistics() {
  const [conferences, setConferences] = useState<StatisticsConference[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState<ConferenceStatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStatisticsConferences()
      .then(items => {
        if (!active) return;
        setConferences(items);
        setSelectedId(current => current || items[0]?.id || "");
      })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Unable to load conferences."); });
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async (id: string) => {
    if (!id) { setData(null); return; }
    setLoading(true);
    setError("");
    try {
      const result = await getConferenceStatistics(id);
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(selectedId); }, [selectedId, refresh]);

  return (
    <div className="workspace-page statistics-page">
      <div className="statistics-header">
        <div>
          <h1><BarChart3 size={27} /> Conference Statistics</h1>
          <p>Track registrations, available seats, and session occupancy.</p>
        </div>
        <button type="button" className="statistics-refresh" onClick={() => void refresh(selectedId)} disabled={!selectedId || loading}>
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      <label className="statistics-select-label" htmlFor="statistics-conference">Select conference</label>
      <select id="statistics-conference" className="statistics-select" value={selectedId} onChange={event => setSelectedId(event.target.value)}>
        {conferences.length === 0 && <option value="">No conferences available</option>}
        {conferences.map(conference => (
          <option key={conference.id} value={conference.id}>{conference.title} ({conference.status})</option>
        ))}
      </select>

      {error && <p className="statistics-error" role="alert">{error}</p>}
      {loading && <p role="status">Loading statistics...</p>}
      {!loading && data && (
        <>
          <div className="statistics-cards">
            <article className="statistics-card"><span>Registered attendees</span><strong>{data.registered} / {data.capacity}</strong></article>
            <article className="statistics-card"><span>Available places</span><strong>{data.available}</strong></article>
            <article className="statistics-card"><span>Conference occupancy</span><strong>{data.occupancyPercent}%</strong></article>
            <article className="statistics-card"><span>Session waitlist entries</span><strong>{data.totalWaitlisted}</strong></article>
          </div>

          <section className="statistics-panel">
            <h2>Conference occupancy</h2>
            <div className="statistics-bar" role="progressbar" aria-label="Conference occupancy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.occupancyPercent}>
              <div style={{ width: `${Math.min(100, data.occupancyPercent)}%` }} />
            </div>
            <p>{data.registered} registered · {data.available} available</p>
          </section>

          <section className="statistics-panel">
            <h2>Session occupancy</h2>
            {data.sessions.length === 0 ? <p>No accepted sessions yet.</p> : (
              <div className="statistics-table-wrap">
                <table className="statistics-table">
                  <thead><tr><th>Session</th><th>Room</th><th>Reserved</th><th>Available</th><th>Waitlist</th><th>Occupancy</th></tr></thead>
                  <tbody>{data.sessions.map(session => (
                    <tr key={session.id}>
                      <td><strong>{session.title}</strong>{!session.scheduled && <small>Not scheduled</small>}</td>
                      <td>{session.roomName ?? "—"}</td>
                      <td>{session.scheduled ? `${session.reserved} / ${session.capacity}` : "—"}</td>
                      <td>{session.scheduled ? session.available : "—"}</td>
                      <td>{session.waitlisted}</td>
                      <td>{session.scheduled ? <div className="statistics-occupancy"><span>{session.occupancyPercent}%</span><div className="statistics-bar"><div style={{ width: `${Math.min(100, session.occupancyPercent)}%` }} /></div></div> : "—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
