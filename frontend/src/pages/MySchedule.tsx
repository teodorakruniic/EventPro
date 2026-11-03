
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Armchair,
  CalendarDays,
  Clock3,
  DoorOpen,
  MapPin,
  Mic2,
  Trash2,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import {
  getMyReservations,
  cancelReservation,
  type Reservation,
} from "../services/reservations";

import SeatPicker from "../components/SeatPicker";
import "./MySchedule.css";

type ReservationWithSeat = Reservation & {
  seatNumber?: string | null;
};

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
  const [reservations, setReservations] = useState<
    ReservationWithSeat[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [busyTalkId, setBusyTalkId] = useState<string | null>(null);
  const [selectedTalkId, setSelectedTalkId] = useState<string | null>(
    null
  );

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

  async function handleCancel(reservation: ReservationWithSeat) {
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

  const upcomingCount = reservations.filter(
    (item) =>
      item.talk.startsAt &&
      new Date(item.talk.startsAt).getTime() > Date.now()
  ).length;

  const assignedSeatsCount = reservations.filter(
    (item) => Boolean(item.seatNumber)
  ).length;

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ATTENDEE PORTAL</span>
          <h1>My Schedule</h1>
          <p>
            Your personal conference agenda, reserved sessions,
            and assigned seats.
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
          <strong>{upcomingCount}</strong>
        </div>

        <div className="schedule-stat">
          <span>Assigned Seats</span>
          <strong>{assignedSeatsCount}</strong>
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
          {reservations.map((reservation) => {
            const isPast =
              reservation.talk.startsAt !== null &&
              new Date(reservation.talk.startsAt).getTime() <=
                Date.now();

            return (
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
                    <CheckCircle2 size={15} />
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

                <div className="my-schedule-seat-box">
                  <div className="my-schedule-seat-icon">
                    <Armchair size={23} />
                  </div>

                  <div>
                    <span>Your Reserved Seat</span>
                    <strong>
                      {reservation.seatNumber ?? "Not assigned"}
                    </strong>
                  </div>

                  {!isPast && (
                    <button
                      type="button"
                      className="my-schedule-change-seat"
                      onClick={() =>
                        setSelectedTalkId(reservation.talkId)
                      }
                    >
                      {reservation.seatNumber
                        ? "Change Seat"
                        : "Choose Seat"}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                <div className="my-schedule-actions">
                  <Link
                    to={`/conferences/${reservation.talk.conference.id}/program`}
                    className="schedule-secondary-button"
                  >
                    View Program
                  </Link>

                  {!isPast && (
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
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTalkId && (
        <SeatPicker
          talkId={selectedTalkId}
          onClose={() => setSelectedTalkId(null)}
          onUpdated={async () => {
            await loadReservations();
          }}
        />
      )}
    </div>
  );
}
