
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import {
  getPublishedConferences,
  type Conference,
} from "../services/conferences";
import { Link } from "react-router-dom";

export default function Conferences() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPublishedConferences()
      .then(setConferences)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load conferences.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = conferences.filter((conference) =>
    `${conference.title} ${conference.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DISCOVER EVENTS</span>
          <h1>Explore Conferences</h1>
          <p>Discover published conferences and upcoming events.</p>
        </div>
      </div>

      <input
        className="conference-search"
        type="search"
        placeholder="Search by title or location..."
        aria-label="Search conferences"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading conferences...</p>}
      {error && <p className="page-error" role="alert">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>No conferences found</h3>
          <p>Try another search or check back later.</p>
        </div>
      )}

      <div className="conference-grid">
        {filtered.map((conference) => (
          <article className="conference-card" key={conference.id}>
            <span className="status-pill status-published">
              Published
            </span>

            <h3>
  <Link to={`/conferences/${conference.id}`}>
    {conference.title}
  </Link>
</h3>
            <p className="conference-description">
              {conference.description || "No description provided."}
            </p>

            <div className="conference-meta">
              <span>
                <MapPin size={16} />
                {conference.location}
              </span>
              <span>
                <CalendarDays size={16} />
                {new Date(conference.startsAt).toLocaleDateString("en-GB")}
              </span>
              {conference.organizer && (
                <span>
                  <UserRound size={16} />
                  {conference.organizer.firstName}{" "}
                  {conference.organizer.lastName}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
