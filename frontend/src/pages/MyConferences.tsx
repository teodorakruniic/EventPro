
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  Send,
  Users,
  Search,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import {
  getMyConferences,
  publishConference,
  deleteConference,
  type Conference,
  type ConferenceStatus,
} from "../services/conferences";

type StatusFilter = "ALL" | ConferenceStatus;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyConferences() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const conferences = await getMyConferences();
      setItems(conferences);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conferences."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statistics = useMemo(() => {
    const drafts = items.filter(
      (conference) => conference.status === "DRAFT"
    ).length;

    const published = items.filter(
      (conference) => conference.status === "PUBLISHED"
    ).length;

    const registered = items.reduce(
      (total, conference) =>
        total + (conference._count?.registrations ?? 0),
      0
    );

    return {
      total: items.length,
      drafts,
      published,
      registered,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((conference) => {
      const matchesSearch = [
        conference.title,
        conference.description ?? "",
        conference.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        conference.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  async function handlePublish(id: string) {
    if (busyId) return;

    setBusyId(id);
    setError("");

    try {
      await publishConference(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Publishing failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (busyId) return;

    const confirmed = window.confirm(
      "Delete this draft conference? This action cannot be undone."
    );

    if (!confirmed) return;

    setBusyId(id);
    setError("");

    try {
      await deleteConference(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Deletion failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            EVENT MANAGEMENT
          </span>
          <h1>My Conferences</h1>
          <p>
            Manage your conferences, track registrations,
            and publish your events.
          </p>
        </div>

        <Link
          className="action-button"
          to="/conferences/new"
        >
          <Plus size={17} />
          New conference
        </Link>
      </div>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      <div className="my-conference-stats">
        <div className="my-conference-stat">
          <div className="my-conference-stat-icon">
            <CalendarDays size={20} />
          </div>
          <span>Total conferences</span>
          <strong>{statistics.total}</strong>
        </div>

        <div className="my-conference-stat">
          <div className="my-conference-stat-icon">
            <FileText size={20} />
          </div>
          <span>Draft conferences</span>
          <strong>{statistics.drafts}</strong>
        </div>

        <div className="my-conference-stat">
          <div className="my-conference-stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <span>Published events</span>
          <strong>{statistics.published}</strong>
        </div>

        <div className="my-conference-stat">
          <div className="my-conference-stat-icon">
            <Users size={20} />
          </div>
          <span>Total registrations</span>
          <strong>{statistics.registered}</strong>
        </div>
      </div>

      <div className="my-conference-toolbar">
        <div className="my-conference-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search your conferences..."
            aria-label="Search your conferences"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="my-conference-filter"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as StatusFilter
            )
          }
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <button
          className="my-conference-refresh"
          type="button"
          title="Refresh conferences"
          aria-label="Refresh conferences"
          disabled={loading || busyId !== null}
          onClick={() => void load()}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading && <p>Loading your conferences...</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={32} />

          <h3>
            {items.length === 0
              ? "No conferences yet"
              : "No matching conferences"}
          </h3>

          <p>
            {items.length === 0
              ? "Create your first conference to get started."
              : "Try changing your search or status filter."}
          </p>

          {items.length === 0 && (
            <Link
              className="action-button"
              to="/conferences/new"
            >
              <Plus size={16} />
              Create conference
            </Link>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="my-conference-count">
            Showing {filtered.length} of {items.length} conferences
          </p>

          <div className="conference-grid">
            {filtered.map((conference) => {
              const registered =
                conference._count?.registrations ?? 0;

              const capacity = conference.capacity;
              const available = Math.max(
                0,
                capacity - registered
              );

              const occupancy =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (registered / capacity) * 100
                      )
                    )
                  : 0;

              const isDraft =
                conference.status === "DRAFT";

              const isPublished =
                conference.status === "PUBLISHED";

              return (
                <article
                  className="conference-card my-conference-card"
                  key={conference.id}
                >
                  <div className="conference-card-top">
                    <span
                      className={`status-pill status-${conference.status.toLowerCase()}`}
                    >
                      {conference.status}
                    </span>
                  </div>

                  <h3>{conference.title}</h3>

                  <p className="conference-description">
                    {conference.description ||
                      "No description provided."}
                  </p>

                  <div className="conference-meta">
                    <span>
                      <MapPin size={16} />
                      {conference.location}
                    </span>

                    <span>
                      <CalendarDays size={16} />
                      {formatDate(conference.startsAt)}
                    </span>
                  </div>

                  <div className="my-conference-capacity">
                    <div className="my-conference-capacity-heading">
                      <span>
                        <Users size={16} />
                        {registered} / {capacity} attendees
                      </span>

                      <strong>
                        {available} available
                      </strong>
                    </div>

                    <div
                      className="my-conference-progress"
                      role="progressbar"
                      aria-label="Conference occupancy"
                      aria-valuemin={0}
                      aria-valuemax={capacity}
                      aria-valuenow={registered}
                    >
                      <div
                        className="my-conference-progress-fill"
                        style={{
                          width: `${occupancy}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="my-conference-card-actions">
                    {isDraft && (
                      <>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            navigate(
                              `/conferences/${conference.id}/edit`
                            )
                          }
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="my-publish-button"
                          disabled={busyId !== null}
                          onClick={() =>
                            void handlePublish(conference.id)
                          }
                        >
                          <Send size={16} />
                          {busyId === conference.id
                            ? "Publishing..."
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="danger-action"
                          disabled={busyId !== null}
                          onClick={() =>
                            void handleDelete(conference.id)
                          }
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}

                    {isPublished && (
                      <Link
                        to={`/conferences/${conference.id}`}
                      >
                        <Eye size={16} />
                        View conference
                      </Link>
                    )}

                    {isPublished && (
                      <div className="my-conference-info-label">
                        <BarChart3 size={16} />
                        {occupancy}% occupied
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
