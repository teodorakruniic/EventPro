
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, MapPin, CalendarDays, Pencil, Trash2, Send } from "lucide-react";
import {
  getMyConferences,
  publishConference,
  deleteConference,
  type Conference,
} from "../services/conferences";

export default function MyConferences() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setItems(await getMyConferences());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish(id: string) {
    setBusyId(id);
    try {
      await publishConference(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this draft conference? This cannot be undone.")) {
      return;
    }

    setBusyId(id);
    try {
      await deleteConference(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVENT MANAGEMENT</span>
          <h1>My Conferences</h1>
          <p>Manage your events from draft to publication.</p>
        </div>
        <Link className="action-button" to="/conferences/new">
          <Plus size={17} /> New conference
        </Link>
      </div>

      {error && <p className="page-error" role="alert">{error}</p>}
      {loading && <p>Loading your conferences...</p>}

      {!loading && items.length === 0 && !error && (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>No conferences yet</h3>
          <p>Create your first conference to get started.</p>
          <Link to="/conferences/new">Create conference</Link>
        </div>
      )}

      <div className="conference-grid">
        {items.map((conference) => (
          <article className="conference-card" key={conference.id}>
            <div className="conference-card-top">
              <span className={`status-pill status-${conference.status.toLowerCase()}`}>
                {conference.status}
              </span>
            </div>

            <h3>{conference.title}</h3>
            <p className="conference-description">
              {conference.description || "No description provided."}
            </p>

            <div className="conference-meta">
              <span><MapPin size={16} /> {conference.location}</span>
              <span>
                <CalendarDays size={16} />
                {new Date(conference.startsAt).toLocaleDateString("en-GB")}
              </span>
            </div>

            {conference.status === "DRAFT" && (
              <div className="conference-actions">
                <button
                  disabled={busyId === conference.id}
                  onClick={() => navigate(`/conferences/${conference.id}/edit`)}
                >
                  <Pencil size={15} /> Edit
                </button>
                <button
                  disabled={busyId === conference.id}
                  onClick={() => void handlePublish(conference.id)}
                >
                  <Send size={15} /> Publish
                </button>
                <button
                  className="danger-action"
                  disabled={busyId === conference.id}
                  onClick={() => void handleDelete(conference.id)}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
