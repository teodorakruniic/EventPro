
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Mic2 } from "lucide-react";
import { getPublishedConferences } from "../services/conferences";
import {
  getMyTalks,
  submitTalk,
  updateTalk,
} from "../services/talks";
import type { Conference } from "../services/conferences";

export default function SubmitTalk() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const initialConferenceId = params.get("conference") ?? "";

  const [conferences, setConferences] = useState<Conference[]>([]);
  const [conferenceId, setConferenceId] = useState(initialConferenceId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [available, proposals] = await Promise.all([
          getPublishedConferences(),
          editId ? getMyTalks() : Promise.resolve([]),
        ]);

        if (!active) return;

        setConferences(available);

        if (editId) {
          const proposal = proposals.find(
            (item) => item.id === editId
          );

          if (!proposal || proposal.status !== "PENDING") {
            throw new Error("Editable proposal not found.");
          }

          setTitle(proposal.title);
          setDescription(proposal.description);
          setConferenceId(proposal.conferenceId);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load proposal form."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [editId]);

  const selectedConference = conferences.find(
    (conference) => conference.id === conferenceId
  );

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 20 &&
    Boolean(conferenceId) &&
    !saving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canSubmit) return;

    setSaving(true);

    try {
      if (editId) {
        await updateTalk(editId, {
          title: title.trim(),
          description: description.trim(),
        });
      } else {
        await submitTalk({
          title: title.trim(),
          description: description.trim(),
          conferenceId,
        });
      }

      navigate("/my-talks");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save proposal."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SPEAKER PORTAL</span>
          <h1>{editId ? "Edit Proposal" : "Submit Talk Proposal"}</h1>
          <p>
            {editId
              ? "Update your pending talk proposal."
              : "Share your ideas with conference organizers."}
          </p>
        </div>

        <Link to="/my-talks" className="talk-secondary-link">
          <ArrowLeft size={16} />
          My proposals
        </Link>
      </div>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading proposal form...</p>
      ) : (
        <form className="talk-form-card" onSubmit={handleSubmit}>
          <div className="talk-form-heading">
            <Mic2 size={22} />
            <div>
              <h2>Talk information</h2>
              <p>Provide the details of your proposed session.</p>
            </div>
          </div>

          <div className="talk-field">
            <label htmlFor="talk-conference">Conference</label>
            <select
              id="talk-conference"
              value={conferenceId}
              onChange={(event) => setConferenceId(event.target.value)}
              disabled={Boolean(editId)}
              required
            >
              <option value="">Select a conference</option>
              {conferences.map((conference) => (
                <option key={conference.id} value={conference.id}>
                  {conference.title}
                </option>
              ))}
              {editId &&
                conferenceId &&
                !selectedConference && (
                  <option value={conferenceId}>
                    Current conference
                  </option>
                )}
            </select>
          </div>

          <div className="talk-field">
            <label htmlFor="talk-title">Talk title</label>
            <input
              id="talk-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={200}
              placeholder="Enter your talk title"
              required
            />
            <small>{title.length} / 200 characters</small>
          </div>

          <div className="talk-field">
            <label htmlFor="talk-description">Description</label>
            <textarea
              id="talk-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              minLength={20}
              maxLength={5000}
              rows={8}
              placeholder="Describe the topic, main ideas, and what attendees will learn..."
              required
            />
            <small>
              Minimum 20 characters · {description.length} / 5000
            </small>
          </div>

          <div className="talk-form-actions">
            <Link to="/my-talks" className="talk-secondary-link">
              Cancel
            </Link>
            <button
              type="submit"
              className="action-button"
              disabled={!canSubmit}
            >
              <Send size={16} />
              {saving
                ? "Saving..."
                : editId
                  ? "Save changes"
                  : "Submit proposal"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
