
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  DoorOpen,
  MapPin,
  Mic2,
  Trash2,
  RefreshCw,
} from "lucide-react";

import {
  getMyReservations,
  cancelReservation,
  type Reservation,
} from "../services/reservations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MySchedule() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTalkId, setBusyTalkId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyReservations();

      setReservations(
        [...data].sort((a, b) => {
          const first = a.talk.startsAt
            ? new Date(a.talk.startsAt).getTime()
            : Number.MAX_SAFE_INTEGER;

          const second = b.talk.startsAt
            ? new Date(b.talk.startsAt).getTime()
            : Number.MAX_SAFE_INTEGER;

          return first - second;
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your schedule."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function handleCancel(reservation: Reservation) {
    if (
      !window.confirm(
        `Cancel your reservation for "${reservation.talk.title}"?`
      )
    ) {
      return;
    }

    setBusyTalkId(reservation.talkId);
    setError("");
    setSuccess("");

    try {
      await cancelReservation(reservation.talkId);

      setReservations((current) =>
        current.filter((item) => item.id !== reservation.id)
      );

      setSuccess("Reservation cancelled successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel reservation."
      );
    } finally {
      setBusyTalkId(null);
    }
  }

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ATTENDEE PORTAL</span>
          <h1>My Schedule</h1>
          <p>
            Manage your reserved sessions and build your
            personal conference agenda.
          </p>
        </div>

        <button
          type="button"
          className="schedule-secondary-button"
          onClick={() => void loadReservations()}
          disabled={loading || busyTalkId !== null}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="schedule-stats">
        <div className="schedule-stat">
          <span>Reserved Sessions</span>
          <strong>{reservations.length}</strong>
        </div>

        <div className="schedule-stat">
          <span>Upcoming Sessions</span>
          <strong>
            {
              reservations.filter(
                (item) =>
                  item.talk.startsAt &&
                  new Date(item.talk.startsAt) > new Date()
              ).length
            }
          </strong>
        </div>
      </div>

      {error && (
        <p className="schedule-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="schedule-success" role="status">
          {success}
        </p>
      )}

      {loading ? (
        <p>Loading your reservations...</p>
      ) : reservations.length === 0 ? (
        <div className="schedule-empty">
          <CalendarDays size={34} />
          <h3>No reservations yet</h3>
          <p>
            Explore conferences and reserve your first session.
          </p>

          <Link
            to="/conferences"
            className="schedule-primary-button"
          >
            Explore Conferences
          </Link>
        </div>
      ) : (
        <div className="my-schedule-list">
          {reservations.map((reservation) => (
            <article
              className="schedule-panel my-schedule-card"
              key={reservation.id}
            >
              <div className="my-schedule-card-top">
                <div>
                  <span className="eyebrow">
                    {reservation.talk.conference.title}
                  </span>

                  <h2>{reservation.talk.title}</h2>
                  <p>{reservation.talk.description}</p>
                </div>

                <span className="my-schedule-status">
                  Reserved
                </span>
              </div>

              <div className="schedule-talk-meta">
                {reservation.talk.startsAt && (
                  <span>
                    <CalendarDays size={16} />
                    {formatDate(reservation.talk.startsAt)}
                  </span>
                )}

                {reservation.talk.endsAt && (
                  <span>
                    <Clock3 size={16} />
                    Until {formatTime(reservation.talk.endsAt)}
                  </span>
                )}

                <span>
                  <DoorOpen size={16} />
                  {reservation.talk.room?.name ?? "Room TBA"}
                </span>

                <span>
                  <Mic2 size={16} />
                  {reservation.talk.speaker.firstName}{" "}
                  {reservation.talk.speaker.lastName}
                </span>

                <span>
                  <MapPin size={16} />
                  {reservation.talk.conference.location}
                </span>
              </div>

              <div className="my-schedule-actions">
                <Link
                  to={`/conferences/${reservation.talk.conference.id}/program`}
                  className="schedule-secondary-button"
                >
                  View Program
                </Link>

                <button
                  type="button"
                  className="schedule-danger-button"
                  onClick={() => void handleCancel(reservation)}
                  disabled={busyTalkId !== null}
                >
                  <Trash2 size={16} />
                  {busyTalkId === reservation.talkId
                    ? "Cancelling..."
                    : "Cancel Reservation"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
