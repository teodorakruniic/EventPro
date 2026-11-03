import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive, CalendarDays, Camera, CheckCircle2, Copy, Eye, FileText,
  ImagePlus, MapPin, Pencil, Plus, RefreshCw, Search, Send, Trash2, Users,
} from "lucide-react";
import {
  getMyConferences, publishConference, deleteConference,
  type Conference, type ConferenceStatus,
} from "../services/conferences";
import { API_URL, apiRequest } from "../services/api";
import "./MyConferences.css";

type ConferenceWithImage = Conference & { imageUrl?: string | null };
type StatusFilter = "ALL" | ConferenceStatus;
type SortMode = "NEWEST" | "DATE_ASC" | "DATE_DESC" | "TITLE";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function MyConferences() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [items, setItems] = useState<ConferenceWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("NEWEST");

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const conferences = await getMyConferences();
      setItems(conferences);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const statistics = useMemo(() => ({
    total: items.length,
    drafts: items.filter((c) => c.status === "DRAFT").length,
    published: items.filter((c) => c.status === "PUBLISHED").length,
    archived: items.filter((c) => c.status === "ARCHIVED").length,
    registered: items.reduce((sum, c) => sum + (c._count?.registrations ?? 0), 0),
  }), [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = items.filter((c) =>
      [c.title, c.description ?? "", c.location].join(" ").toLowerCase().includes(query) &&
      (statusFilter === "ALL" || c.status === statusFilter)
    );
    return [...matches].sort((a, b) => {
      if (sort === "TITLE") return a.title.localeCompare(b.title);
      if (sort === "DATE_ASC") return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (sort === "DATE_DESC") return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [items, search, statusFilter, sort]);

  async function perform(id: string, action: () => Promise<unknown>, success: string) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await action();
      await load(false);
      setNotice(success);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(conference: ConferenceWithImage) {
    if (busyId || conference.status !== "DRAFT") return;
    if (!window.confirm(`Permanently delete the draft "${conference.title}"? This cannot be undone.`)) return;
    void perform(conference.id, () => deleteConference(conference.id), "Draft conference deleted.");
  }

  function handleArchive(conference: ConferenceWithImage) {
    if (busyId || conference.status === "ARCHIVED") return;
    if (!window.confirm(`Archive "${conference.title}"? It will no longer appear in public listings.`)) return;
    void perform(
      conference.id,
      () => apiRequest(`/api/conferences/${conference.id}/archive`, { method: "PATCH" }),
      "Conference archived successfully."
    );
  }

  function handleDuplicate(conference: ConferenceWithImage) {
    void perform(
      conference.id,
      () => apiRequest(`/api/conferences/${conference.id}/duplicate`, { method: "POST" }),
      "Conference duplicated as a draft."
    );
  }

  function selectImage(id: string) {
    if (busyId) return;
    setUploadFor(id);
    fileInput.current?.click();
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const id = uploadFor;
    event.target.value = "";
    if (!file || !id) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must not exceed 5 MB.");
      return;
    }
    const body = new FormData();
    body.append("image", file);
    await perform(
      id,
      () => apiRequest(`/api/conferences/${id}/image`, { method: "POST", body }),
      "Conference cover image updated."
    );
  }

  function removeImage(conference: ConferenceWithImage) {
    if (!conference.imageUrl || busyId) return;
    if (!window.confirm(`Remove the cover image from "${conference.title}"?`)) return;
    void perform(
      conference.id,
      () => apiRequest(`/api/conferences/${conference.id}/image`, { method: "DELETE" }),
      "Conference cover image removed."
    );
  }

  return (
    <div className="workspace-page conference-manager">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVENT MANAGEMENT</span>
          <h1>My Conferences</h1>
          <p>Manage your events, cover images, registrations and publishing.</p>
        </div>
        <Link className="action-button" to="/conferences/new">
          <Plus size={17} /> New conference
        </Link>
      </div>

      {error && <div className="page-error" role="alert">{error}</div>}
      {notice && <div className="conference-manager-notice" role="status">{notice}</div>}

      <div className="my-conference-stats">
        <div className="my-conference-stat"><div className="my-conference-stat-icon"><CalendarDays size={20}/></div><span>Total conferences</span><strong>{statistics.total}</strong></div>
        <div className="my-conference-stat"><div className="my-conference-stat-icon"><FileText size={20}/></div><span>Draft conferences</span><strong>{statistics.drafts}</strong></div>
        <div className="my-conference-stat"><div className="my-conference-stat-icon"><CheckCircle2 size={20}/></div><span>Published events</span><strong>{statistics.published}</strong></div>
        <div className="my-conference-stat"><div className="my-conference-stat-icon"><Users size={20}/></div><span>Total registrations</span><strong>{statistics.registered}</strong></div>
      </div>

      <div className="my-conference-toolbar">
        <div className="my-conference-search">
          <Search size={18}/>
          <input type="search" placeholder="Search by title, location or description..." aria-label="Search conferences" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        <select className="my-conference-filter" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select className="my-conference-filter" aria-label="Sort conferences" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          <option value="NEWEST">Recently created</option>
          <option value="DATE_ASC">Event date: earliest</option>
          <option value="DATE_DESC">Event date: latest</option>
          <option value="TITLE">Title A–Z</option>
        </select>
        <button className="my-conference-refresh" type="button" title="Refresh conferences" aria-label="Refresh conferences" disabled={loading || busyId !== null} onClick={() => { setError(""); setNotice(""); void load(); }}><RefreshCw size={18}/></button>
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { void handleImageChange(e); }} hidden aria-label="Conference cover image"/>

      {loading ? <p>Loading your conferences...</p> : filtered.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={32}/>
          <h3>{items.length === 0 ? "No conferences yet" : "No matching conferences"}</h3>
          <p>{items.length === 0 ? "Create your first conference to get started." : "Try another search or status filter."}</p>
          {items.length === 0 && <Link className="action-button" to="/conferences/new"><Plus size={16}/> Create conference</Link>}
        </div>
      ) : (
        <>
          <p className="my-conference-count">Showing {filtered.length} of {items.length} conferences · {statistics.archived} archived</p>
          <div className="conference-grid">
            {filtered.map((conference) => {
              const registered = conference._count?.registrations ?? 0;
              const capacity = conference.capacity;
              const occupancy = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
              const available = Math.max(0, capacity - registered);
              const isDraft = conference.status === "DRAFT";
              const isPublished = conference.status === "PUBLISHED";
              const busy = busyId === conference.id;
              const image = conference.imageUrl ? `${API_URL}${conference.imageUrl}` : null;

              return (
                <article className="conference-card my-conference-card conference-manager-card" key={conference.id}>
                  <div className="conference-manager-cover">
                    {image ? <img src={image} alt={`Cover for ${conference.title}`}/> : <div className="conference-manager-placeholder"><CalendarDays size={36}/><span>No cover image</span></div>}
                    <span className={`status-pill status-${conference.status.toLowerCase()}`}>{conference.status}</span>
                    <div className="conference-manager-image-actions">
                      <button type="button" disabled={busyId !== null} onClick={() => selectImage(conference.id)} title="Upload or replace cover image"><Camera size={15}/>{image ? "Change" : "Add photo"}</button>
                      {image && <button type="button" disabled={busyId !== null} onClick={() => removeImage(conference)} title="Remove cover image"><Trash2 size={15}/></button>}
                    </div>
                  </div>
                  <div className="conference-manager-body">
                    <h3>{conference.title}</h3>
                    <p className="conference-description">{conference.description || "No description provided."}</p>
                    <div className="conference-meta">
                      <span><MapPin size={16}/>{conference.location}</span>
                      <span><CalendarDays size={16}/>{formatDate(conference.startsAt)}</span>
                    </div>
                    <div className="my-conference-capacity">
                      <div className="my-conference-capacity-heading">
                        <span><Users size={16}/>{registered} / {capacity} attendees</span>
                        <strong>{available} available</strong>
                      </div>
                      <div className="my-conference-progress" role="progressbar" aria-label="Conference occupancy" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={Math.min(registered, capacity)}>
                        <div className="my-conference-progress-fill" style={{ width: `${occupancy}%` }}/>
                      </div>
                    </div>
                    <div className="my-conference-card-actions conference-manager-actions">
                      {isDraft && <>
                        <button type="button" disabled={busyId !== null} onClick={() => navigate(`/conferences/${conference.id}/edit`)}><Pencil size={16}/> Edit</button>
                        <button type="button" className="my-publish-button" disabled={busyId !== null} onClick={() => { void perform(conference.id, () => publishConference(conference.id), "Conference published successfully."); }}><Send size={16}/>{busy ? "Working..." : "Publish"}</button>
                        <button type="button" className="danger-action" disabled={busyId !== null} onClick={() => handleDelete(conference)}><Trash2 size={16}/> Delete</button>
                      </>}
                      {isPublished && <Link to={`/conferences/${conference.id}`}><Eye size={16}/> View</Link>}
                      <button type="button" disabled={busyId !== null} onClick={() => handleDuplicate(conference)}><Copy size={16}/>{busy ? "Working..." : "Duplicate"}</button>
                      {conference.status !== "ARCHIVED" && <button type="button" disabled={busyId !== null} onClick={() => handleArchive(conference)}><Archive size={16}/> Archive</button>}
                      {conference.status === "ARCHIVED" && <span className="conference-manager-archived"><Archive size={15}/> Archived</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      <p className="conference-manager-hint"><ImagePlus size={16}/> Cover images: JPG, PNG or WebP, up to 5 MB. Drafts can be deleted; published events can be archived.</p>
    </div>
  );
}
