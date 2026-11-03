
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createConference,
  getMyConferences,
  updateConference,
  type ConferenceInput,
} from "../services/conferences";

function toLocalInput(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CreateConference() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    let active = true;

    getMyConferences()
      .then((items) => {
        if (!active) return;
        const conference = items.find((item) => item.id === id);

        if (!conference || conference.status !== "DRAFT") {
          throw new Error("Editable draft conference not found.");
        }

        setTitle(conference.title);
        setDescription(conference.description ?? "");
        setLocation(conference.location);
        setStartsAt(toLocalInput(conference.startsAt));
        setEndsAt(toLocalInput(conference.endsAt));
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load conference.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("End date must be after start date.");
      return;
    }

    const data: ConferenceInput = {
      title,
      description,
      location,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };

    setSaving(true);

    try {
      if (id) {
        await updateConference(id, data);
      } else {
        await createConference(data);
      }
      navigate("/my-conferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save conference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVENT MANAGEMENT</span>
          <h1>{editing ? "Edit Conference" : "Create Conference"}</h1>
          <p>
            {editing
              ? "Update the details of your draft conference."
              : "Enter the details of your new event."}
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading conference...</p>
      ) : (
        <form className="conference-form" onSubmit={handleSubmit}>
          <h2>Conference details</h2>

          {error && <p className="page-error" role="alert">{error}</p>}

          <div className="field">
            <label htmlFor="conference-title">Conference title</label>
            <input
              id="conference-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. European Technology Summit"
              minLength={3}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="conference-description">Description</label>
            <textarea
              id="conference-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this conference about?"
              rows={5}
            />
          </div>

          <div className="field">
            <label htmlFor="conference-location">Location</label>
            <input
              id="conference-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Maribor, Slovenia"
              minLength={2}
              required
            />
          </div>

          <div className="form-two-columns">
            <div className="field">
              <label htmlFor="conference-start">Start date and time</label>
              <input
                id="conference-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="conference-end">End date and time</label>
              <input
                id="conference-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <Link className="secondary-button" to="/my-conferences">
              Cancel
            </Link>
            <button className="action-button" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create draft"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
