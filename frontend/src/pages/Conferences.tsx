import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, MapPin, UserRound, Users, Search, ArrowRight,
  RefreshCw, ImageIcon, SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  conferenceImageUrl, getPublishedConferences, type Conference,
} from "../services/conferences";
import "./Conferences.css";

type SortOption = "upcoming" | "latest" | "title";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Conferences() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("upcoming");
  const [showPast, setShowPast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadConferences(initial = false) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      setConferences(await getPublishedConferences());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conferences.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void loadConferences(true); }, []);

  const locations = useMemo(() =>
    Array.from(new Set(conferences.map((item) => item.location.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)), [conferences]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();
    const results = conferences.filter((conference) => {
      const searchableText = [
        conference.title, conference.description ?? "", conference.location,
        conference.organizer?.firstName ?? "", conference.organizer?.lastName ?? "",
      ].join(" ").toLowerCase();
      return searchableText.includes(query) &&
        (!location || conference.location === location) &&
        (showPast || new Date(conference.endsAt).getTime() >= now);
    });
    return results.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "latest") return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [conferences, search, location, sortBy, showPast]);

  return (
    <div className="workspace-page explore-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DISCOVER EVENTS</span>
          <h1>Explore Conferences</h1>
          <p>Discover conferences, explore upcoming sessions, and find events that interest you.</p>
        </div>
      </div>

      <div className="explore-toolbar">
        <label className="explore-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search events, organizers, locations..."
            aria-label="Search conferences" value={search}
            onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="explore-select-wrap">
          <MapPin size={17} aria-hidden="true" />
          <select aria-label="Filter by location" value={location}
            onChange={(event) => setLocation(event.target.value)}>
            <option value="">All locations</option>
            {locations.map((place) => <option key={place} value={place}>{place}</option>)}
          </select>
        </label>
        <label className="explore-select-wrap">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <select aria-label="Sort conferences" value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}>
            <option value="upcoming">Date: earliest first</option>
            <option value="latest">Date: latest first</option>
            <option value="title">Title: A to Z</option>
          </select>
        </label>
        <button className="explore-refresh" type="button" onClick={() => void loadConferences()}
          disabled={loading || refreshing} aria-label="Refresh conferences" title="Refresh conferences">
          <RefreshCw size={18} className={refreshing ? "explore-spinning" : ""} />
        </button>
      </div>

      <div className="explore-results-bar">
        <label className="conference-filter-checkbox">
          <input type="checkbox" checked={showPast}
            onChange={(event) => setShowPast(event.target.checked)} />
          Show past conferences
        </label>
        {!loading && !error && <span>{filtered.length} {filtered.length === 1 ? "conference" : "conferences"} found</span>}
      </div>

      {loading && <p>Loading conferences...</p>}
      {error && <div className="empty-state">
        <p className="page-error" role="alert">{error}</p>
        <button className="secondary-button" type="button" onClick={() => void loadConferences()}>Try again</button>
      </div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>No conferences found</h3>
          <p>Try changing your search, location, or past events filter.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="conference-grid explore-grid">
          {filtered.map((conference) => {
            const registered = conference._count?.registrations ?? 0;
            const capacity = conference.capacity;
            const hasCapacity = Number.isFinite(capacity) && capacity > 0;
            const available = hasCapacity ? Math.max(0, capacity - registered) : null;
            const fullyBooked = available === 0;
            const isPast = new Date(conference.endsAt).getTime() < Date.now();
            const occupancy = hasCapacity ? Math.min(100, Math.round(registered / capacity * 100)) : 0;
            const imageUrl = conferenceImageUrl(conference.imageUrl);

            return (
              <article className="conference-card explore-card" key={conference.id}>
                <Link to={`/conferences/${conference.id}`} className="explore-card-media"
                  aria-label={`View ${conference.title}`}>
                  {imageUrl ? <img src={imageUrl} alt={`Cover for ${conference.title}`} loading="lazy" /> :
                    <div className="explore-card-placeholder"><ImageIcon size={34} /><span>EventPro</span></div>}
                  <div className="explore-card-badges">
                    <span className={`status-pill ${isPast ? "status-archived" : "status-published"}`}>
                      {isPast ? "Past event" : "Published"}
                    </span>
                    {fullyBooked && !isPast && <span className="conference-full-badge">Fully booked</span>}
                  </div>
                </Link>
                <div className="explore-card-body">
                  <h3><Link to={`/conferences/${conference.id}`}>{conference.title}</Link></h3>
                  <p className="conference-description">{conference.description || "Discover this event and its sessions."}</p>
                  <div className="conference-meta">
                    <span><MapPin size={16} />{conference.location}</span>
                    <span><CalendarDays size={16} />{formatDate(conference.startsAt)} · {formatTime(conference.startsAt)}</span>
                    {conference.organizer && <span><UserRound size={16} />{conference.organizer.firstName} {conference.organizer.lastName}</span>}
                  </div>
                  {hasCapacity && <div className="conference-capacity-info">
                    <div className="conference-capacity-heading">
                      <span><Users size={16} />{registered} / {capacity} attendees</span>
                      <span>{fullyBooked ? "No seats left" : `${available} seats available`}</span>
                    </div>
                    <div className="conference-capacity-track" role="progressbar" aria-label="Conference occupancy"
                      aria-valuenow={registered} aria-valuemin={0} aria-valuemax={capacity}>
                      <div className="conference-capacity-fill" style={{ width: `${occupancy}%` }} />
                    </div>
                  </div>}
                  <Link className="conference-view-link" to={`/conferences/${conference.id}`}>
                    View details <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
