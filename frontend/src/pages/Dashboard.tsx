
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FileText, Globe2, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getMyConferences,
  getPublishedConferences,
} from "../services/conferences";

export default function Dashboard() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER";

  const [published, setPublished] = useState<number | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const publicItems = await getPublishedConferences();
        if (active) setPublished(publicItems.length);

        if (isOrganizer) {
          const myItems = await getMyConferences();
          if (active) {
            setMine(myItems.length);
            setDrafts(myItems.filter((item) => item.status === "DRAFT").length);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load statistics.");
        }
      }
    }

    void load();
    return () => { active = false; };
  }, [isOrganizer]);

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.firstName}.</p>
        </div>
      </div>

      <section className="welcome-card">
        <span className="eyebrow">EVENTPRO PLATFORM</span>
        <h2>Everything you need to manage your events.</h2>
        <p>
          Explore conferences and keep your event planning organized
          in one central workspace.
        </p>
      </section>

      {error && <p className="page-error" role="alert">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <Globe2 size={22} />
          <span>Published conferences</span>
          <strong>{published ?? "—"}</strong>
        </div>

        {isOrganizer && (
          <>
            <div className="stat-card">
              <CalendarDays size={22} />
              <span>My conferences</span>
              <strong>{mine ?? "—"}</strong>
            </div>
            <div className="stat-card">
              <FileText size={22} />
              <span>Draft conferences</span>
              <strong>{drafts ?? "—"}</strong>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-links">
        <Link to="/conferences" className="quick-link">
          <CalendarDays size={21} />
          <span>Explore Conferences</span>
        </Link>

        {isOrganizer && (
          <>
            <Link to="/my-conferences" className="quick-link">
              <FileText size={21} />
              <span>Manage Conferences</span>
            </Link>
            <Link to="/conferences/new" className="quick-link">
              <Plus size={21} />
              <span>Create Conference</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
