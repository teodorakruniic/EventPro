
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Check,
  X,
  RefreshCw,
  ClipboardList,
  UserRound,
} from "lucide-react";
import {
  getMyConferences,
  type Conference,
} from "../services/conferences";
import {
  getReviewTalks,
  reviewTalk,
  type Talk,
} from "../services/talks";

export default function ReviewTalks() {
  const [params, setParams] = useSearchParams();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const conferenceId = params.get("conference") ?? "";

  const loadConferences = useCallback(async () => {
    try {
      const data = await getMyConferences();
      setConferences(data);

      if (!conferenceId && data.length > 0) {
        setParams(
          { conference: data[0].id },
          { replace: true }
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conferences."
      );
    }
  }, [conferenceId, setParams]);

  const loadTalks = useCallback(async () => {
    if (!conferenceId) {
      setTalks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      setTalks(await getReviewTalks(conferenceId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load proposals."
      );
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    void loadConferences();
  }, [loadConferences]);

  useEffect(() => {
    void loadTalks();
  }, [loadTalks]);

  const stats = useMemo(
    () => ({
      pending: talks.filter((talk) => talk.status === "PENDING").length,
      accepted: talks.filter((talk) => talk.status === "ACCEPTED").length,
      rejected: talks.filter((talk) => talk.status === "REJECTED").length,
    }),
    [talks]
  );

  async function handleReview(
    id: string,
    status: "ACCEPTED" | "REJECTED"
  ) {
    if (busyId) return;

    setBusyId(id);
    setError("");

    try {
      await reviewTalk(id, status);
      await loadTalks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review proposal."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORGANIZER PORTAL</span>
          <h1>Review Talk Proposals</h1>
          <p>
            Evaluate speaker submissions and build your
            conference program.
          </p>
        </div>

        <Link to="/my-conferences" className="talk-secondary-link">
          My conferences
        </Link>
      </div>

      <div className="talk-review-toolbar">
        <div className="talk-field">
          <label htmlFor="review-conference">
            Select conference
          </label>
          <select
            id="review-conference"
            value={conferenceId}
            onChange={(event) =>
              setParams({ conference: event.target.value })
            }
          >
            <option value="">Select conference</option>
            {conferences.map((conference) => (
              <option key={conference.id} value={conference.id}>
                {conference.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="talk-icon-button"
          onClick={() => void loadTalks()}
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

      <div className="talk-stat-grid">
        {[
          ["Total proposals", talks.length],
          ["Pending review", stats.pending],
          ["Accepted", stats.accepted],
          ["Rejected", stats.rejected],
        ].map(([label, value]) => (
          <div className="talk-stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <p>Loading proposals...</p>
      ) : !conferenceId || talks.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={32} />
          <h3>No proposals to review</h3>
          <p>
            Speaker submissions for the selected conference
            will appear here.
          </p>
        </div>
      ) : (
        <div className="talk-card-grid">
          {talks.map((talk) => (
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
                  <UserRound size={15} />
                  {talk.speaker
                    ? `${talk.speaker.firstName} ${talk.speaker.lastName}`
                    : "Speaker"}
                </span>

                {talk.speaker?.email && (
                  <span>{talk.speaker.email}</span>
                )}
              </div>

              {talk.status === "PENDING" && (
                <div className="talk-card-actions">
                  <button
                    type="button"
                    className="talk-accept-button"
                    disabled={busyId !== null}
                    onClick={() =>
                      void handleReview(talk.id, "ACCEPTED")
                    }
                  >
                    <Check size={16} />
                    Accept
                  </button>

                  <button
                    type="button"
                    className="talk-danger-button"
                    disabled={busyId !== null}
                    onClick={() =>
                      void handleReview(talk.id, "REJECTED")
                    }
                  >
                    <X size={16} />
                    Reject
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
