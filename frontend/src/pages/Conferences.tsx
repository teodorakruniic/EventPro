
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  UserRound,
  Users,
  Search,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getPublishedConferences,
  type Conference,
} from "../services/conferences";

type SortOption = "upcoming" | "latest" | "title";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Conferences() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("upcoming");
  const [showPast, setShowPast] = useState(false);

  async function loadConferences() {
    setLoading(true);
    setError("");

    try {
      const data = await getPublishedConferences();
      setConferences(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conferences."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConferences();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    const results = conferences.filter((conference) => {
      const searchableText = [
        conference.title,
        conference.description ?? "",
        conference.location,
        conference.organizer?.firstName ?? "",
        conference.organizer?.lastName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const isUpcoming =
        new Date(conference.endsAt).getTime() >= now;

      return matchesSearch && (showPast || isUpcoming);
    });

    return results.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === "latest") {
        return (
          new Date(b.startsAt).getTime() -
          new Date(a.startsAt).getTime()
        );
      }

      return (
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime()
      );
    });
  }, [conferences, search, sortBy, showPast]);

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DISCOVER EVENTS</span>
          <h1>Explore Conferences</h1>
          <p>
            Discover conferences, explore upcoming sessions,
            and find events that interest you.
          </p>
        </div>
      </div>

      <div className="conference-explore-toolbar">
        <div className="conference-search-wrapper">
          <Search size={18} aria-hidden="true" />

          <input
            className="conference-search"
            type="search"
            placeholder="Search conferences, locations, organizers..."
            aria-label="Search conferences"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="conference-sort"
          aria-label="Sort conferences"
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as SortOption)
          }
        >
          <option value="upcoming">Date: earliest first</option>
          <option value="latest">Date: latest first</option>
          <option value="title">Title: A to Z</option>
        </select>

        <button
          className="conference-refresh-button"
          type="button"
          onClick={() => void loadConferences()}
          disabled={loading}
          aria-label="Refresh conferences"
          title="Refresh conferences"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <label className="conference-filter-checkbox">
        <input
          type="checkbox"
          checked={showPast}
          onChange={(event) =>
            setShowPast(event.target.checked)
          }
        />
        Show past conferences
      </label>

      {!loading && !error && (
        <p className="conference-results-count">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "conference found"
            : "conferences found"}
        </p>
      )}

      {loading && <p>Loading conferences...</p>}

      {error && (
        <div className="empty-state">
          <p className="page-error" role="alert">
            {error}
          </p>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadConferences()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>No conferences found</h3>
          <p>
            Try changing your search or enable past
            conferences to see more events.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="conference-grid">
          {filtered.map((conference) => {
            const registered =
              conference._count?.registrations ?? 0;

            const capacity = conference.capacity;
            const hasCapacity =
              typeof capacity === "number" &&
              Number.isFinite(capacity) &&
              capacity > 0;

            const available = hasCapacity
              ? Math.max(0, capacity - registered)
              : null;

            const fullyBooked =
              available !== null && available === 0;

            const isPast =
              new Date(conference.endsAt).getTime() <
              Date.now();

            const occupancyPercentage = hasCapacity
              ? Math.min(
                  100,
                  Math.round(
                    (registered / capacity) * 100
                  )
                )
              : 0;

            return (
              <article
                className="conference-card"
                key={conference.id}
              >
                <div className="conference-card-top">
                  <span
                    className={
                      isPast
                        ? "status-pill status-archived"
                        : "status-pill status-published"
                    }
                  >
                    {isPast ? "Past event" : "Published"}
                  </span>

                  {fullyBooked && !isPast && (
                    <span className="conference-full-badge">
                      Fully booked
                    </span>
                  )}
                </div>

                <h3>
                  <Link to={`/conferences/${conference.id}`}>
                    {conference.title}
                  </Link>
                </h3>

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
                    {" · "}
                    {formatTime(conference.startsAt)}
                  </span>

                  {conference.organizer && (
                    <span>
                      <UserRound size={16} />
                      {conference.organizer.firstName}{" "}
                      {conference.organizer.lastName}
                    </span>
                  )}
                </div>

                {hasCapacity && (
                  <div className="conference-capacity-info">
                    <div className="conference-capacity-heading">
                      <span>
                        <Users size={16} />
                        {registered} / {capacity} attendees
                      </span>

                      <span>
                        {fullyBooked
                          ? "No seats left"
                          : `${available} seats available`}
                      </span>
                    </div>

                    <div
                      className="conference-capacity-track"
                      role="progressbar"
                      aria-label="Conference occupancy"
                      aria-valuenow={registered}
                      aria-valuemin={0}
                      aria-valuemax={capacity}
                    >
                      <div
                        className="conference-capacity-fill"
                        style={{
                          width: `${occupancyPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  className="conference-view-link"
                  to={`/conferences/${conference.id}`}
                >
                  View details
                  <ArrowRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
