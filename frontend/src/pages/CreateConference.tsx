
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createConference,
  getMyConferences,
  updateConference,
  type ConferenceInput,
} from "../services/conferences";

function toLocalInput(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

export default function CreateConference() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadConference() {
      setLoading(true);
      setError("");

      try {
        const conferences = await getMyConferences();
        if (!active) return;

        const conference = conferences.find(
          (item) => item.id === id
        );

        if (!conference) {
          throw new Error("Conference not found.");
        }

        if (conference.status !== "DRAFT") {
          throw new Error(
            "Only draft conferences can be edited."
          );
        }

        setTitle(conference.title);
        setDescription(conference.description ?? "");
        setLocation(conference.location);
        setCapacity(String(conference.capacity ?? 100));
        setStartsAt(toLocalInput(conference.startsAt));
        setEndsAt(toLocalInput(conference.endsAt));
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conference."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadConference();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();
    const parsedCapacity = Number(capacity);

    if (cleanTitle.length < 3) {
      setError(
        "Conference title must contain at least 3 characters."
      );
      return;
    }

    if (cleanLocation.length < 2) {
      setError(
        "Location must contain at least 2 characters."
      );
      return;
    }

    if (
      !Number.isSafeInteger(parsedCapacity) ||
      parsedCapacity < 1
    ) {
      setError(
        "Capacity must be a positive whole number."
      );
      return;
    }

    if (!startsAt || !endsAt) {
      setError(
        "Please select both start and end dates."
      );
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setError("Please enter valid conference dates.");
      return;
    }

    if (endDate <= startDate) {
      setError(
        "End date must be after start date."
      );
      return;
    }

    const data: ConferenceInput = {
      title: cleanTitle,
      description: cleanDescription,
      location: cleanLocation,
      capacity: parsedCapacity,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
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
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save conference."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            EVENT MANAGEMENT
          </span>

          <h1>
            {editing
              ? "Edit Conference"
              : "Create Conference"}
          </h1>

          <p>
            {editing
              ? "Update the details of your draft conference."
              : "Create a new conference and configure its details."}
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading conference...</p>
      ) : (
        <form
          className="conference-form"
          onSubmit={handleSubmit}
        >
          <h2>Conference details</h2>

          <p>
            Provide the information attendees will
            see when your conference is published.
          </p>

          {error && (
            <p className="page-error" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor="conference-title">
              Conference title
            </label>

            <input
              id="conference-title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. European Technology Summit"
              minLength={3}
              maxLength={150}
              required
              disabled={saving}
            />
          </div>

          <div className="field">
            <label htmlFor="conference-description">
              Description
            </label>

            <textarea
              id="conference-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the conference, its topics and target audience..."
              rows={5}
              maxLength={5000}
              disabled={saving}
            />
          </div>

          <div className="form-two-columns">
            <div className="field">
              <label htmlFor="conference-location">
                Location
              </label>

              <input
                id="conference-location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="e.g. Maribor, Slovenia"
                minLength={2}
                maxLength={200}
                required
                disabled={saving}
              />
            </div>

            <div className="field">
              <label htmlFor="conference-capacity">
                Maximum attendees
              </label>

              <input
                id="conference-capacity"
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={(event) =>
                  setCapacity(event.target.value)
                }
                placeholder="100"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-two-columns">
            <div className="field">
              <label htmlFor="conference-start">
                Start date and time
              </label>

              <input
                id="conference-start"
                type="datetime-local"
                value={startsAt}
                onChange={(event) =>
                  setStartsAt(event.target.value)
                }
                required
                disabled={saving}
              />
            </div>

            <div className="field">
              <label htmlFor="conference-end">
                End date and time
              </label>

              <input
                id="conference-end"
                type="datetime-local"
                value={endsAt}
                onChange={(event) =>
                  setEndsAt(event.target.value)
                }
                min={startsAt || undefined}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link
              className="secondary-button"
              to="/my-conferences"
            >
              Cancel
            </Link>

            <button
              className="action-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Create draft"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
