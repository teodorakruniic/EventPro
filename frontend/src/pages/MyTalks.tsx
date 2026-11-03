
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Mic2,
  CalendarDays,
  MapPin,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";
import { getMyTalks, withdrawTalk, type Talk } from "../services/talks";

export default function MyTalks() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setTalks(await getMyTalks());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load proposals."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      talks.filter((talk) => {
        const matchesSearch = [
          talk.title,
          talk.description,
          talk.conference?.title ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase().trim());

        return (
          matchesSearch &&
          (filter === "ALL" || talk.status === filter)
        );
      }),
    [talks, search, filter]
  );

  async function handleWithdraw(id: string) {
    if (
      !window.confirm(
        "Withdraw this proposal? This action cannot be undone."
      )
    ) {
      return;
    }

    setBusyId(id);
    setError("");

    try {
      await withdrawTalk(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to withdraw proposal."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SPEAKER PORTAL</span>
          <h1>My Talk Proposals</h1>
          <p>Track and manage your conference submissions.</p>
        </div>
        <Link to="/talks/new" className="action-button">
          <Plus size={17} />
          Submit proposal
        </Link>
      </div>

      <div className="talk-stat-grid">
        {[
          ["Total proposals", talks.length],
          [
            "Pending review",
            talks.filter((talk) => talk.status === "PENDING").length,
          ],
          [
            "Accepted",
            talks.filter((talk) => talk.status === "ACCEPTED").length,
          ],
          [
            "Rejected",
            talks.filter((talk) => talk.status === "REJECTED").length,
          ],
        ].map(([label, value]) => (
          <div className="talk-stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="talk-toolbar">
        <div className="talk-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search proposals..."
            aria-label="Search proposals"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={filter}
          aria-label="Filter proposals by status"
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <button
          type="button"
          className="talk-icon-button"
          onClick={() => void load()}
          disabled={loading || busyId !== null}
          aria-label="Refresh proposals"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading proposals...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Mic2 size={32} />
          <h3>
            {talks.length === 0
              ? "No proposals yet"
              : "No matching proposals"}
          </h3>
          <p>
            {talks.length === 0
              ? "Submit your first talk proposal to get started."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="talk-card-grid">
          {filtered.map((talk) => (
            <article className="talk-card" key={talk.id}>
              <div className="talk-card-top">
                <span
                  className={`status-pill status-${talk.status.toLowerCase()}`}
                >
                  {talk.status}
                </span>
              </div>

              <h3>{talk.title}</h3>
              <p className="talk-card-description">
                {talk.description}
              </p>

              <div className="talk-card-meta">
                <span>
                  <CalendarDays size={15} />
                  {talk.conference?.title ?? "Conference"}
                </span>
                {talk.conference?.location && (
                  <span>
                    <MapPin size={15} />
                    {talk.conference.location}
                  </span>
                )}
              </div>

              {talk.status === "PENDING" && (
                <div className="talk-card-actions">
                  <Link
                    to={`/talks/new?edit=${encodeURIComponent(talk.id)}`}
                    className="talk-secondary-link"
                  >
                    <Pencil size={15} />
                    Edit
                  </Link>

                  <button
                    type="button"
                    className="talk-danger-button"
                    disabled={busyId !== null}
                    onClick={() => void handleWithdraw(talk.id)}
                  >
                    <Trash2 size={15} />
                    {busyId === talk.id
                      ? "Withdrawing..."
                      : "Withdraw"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
