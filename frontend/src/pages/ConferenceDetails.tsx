import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
  Clock3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  getConferenceDetails,
  conferenceImageUrl,
  getConferenceRegistration,
  registerForConference,
  cancelConferenceRegistration,
  type ConferenceDetails as ConferenceDetailsType,
} from "../services/conferences";
import "./ConferenceDetails.css";
import { useAuth } from "../context/AuthContext";
import {
  getConferenceReservations,
} from "../services/reservations";
import SeatPicker from "../components/SeatPicker";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConferenceDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [conference, setConference] = useState<ConferenceDetailsType | null>(
    null
  );

  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reservedTalkIds, setReservedTalkIds] = useState<string[]>([]);
  const [busyTalkId] = useState<string | null>(null);
  const [reservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [selectedTalkId, setSelectedTalkId] = useState<string | null>(null);

  const loadConference = useCallback(async () => {
    if (!id) {
      throw new Error("Invalid conference ID.");
    }

    const [details, registration] = await Promise.all([
      getConferenceDetails(id),
      user
        ? getConferenceRegistration(id)
        : Promise.resolve({ registered: false }),
    ]);

    return { details, registration };
  }, [id, user?.id]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setMessage("");
    setConference(null);
    setRegistered(false);

    loadConference()
      .then(({ details, registration }) => {
        if (!active) return;

        setConference(details);
        setRegistered(registration.registered);
      })
      .catch((err: unknown) => {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : "Unable to load conference."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadConference]);

  useEffect(() => {
    if (!id || user?.role !== "ATTENDEE") {
      setReservedTalkIds([]);
      return;
    }

    let active = true;
    setReservationError("");

    getConferenceReservations(id)
      .then((data) => {
        if (active) setReservedTalkIds(data.talkIds);
      })
      .catch((err: unknown) => {
        if (active) {
          setReservationError(
            err instanceof Error ? err.message : "Unable to load reservations."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [id, user?.id, user?.role]);

  async function refreshConference() {
    if (!id) return;

    setError("");

    try {
      const { details, registration } = await loadConference();

      setConference(details);
      setRegistered(registration.registered);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to refresh conference."
      );
    }
  }

  async function handleRegister() {
    if (!id || !user || user.role !== "ATTENDEE" || registered || processing) {
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      await registerForConference(id);

      setRegistered(true);
      setMessage("You have successfully registered!");

      try {
        const updated = await getConferenceDetails(id);
        setConference(updated);
      } catch {
        // Registration succeeded even if refreshing details fails.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");

      await refreshConference();
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancelRegistration() {
    if (!id || !registered || processing) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel your conference registration?"
    );

    if (!confirmed) return;

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      await cancelConferenceRegistration(id);

      setRegistered(false);
      setMessage("Your registration has been cancelled.");

      try {
        const updated = await getConferenceDetails(id);
        setConference(updated);
      } catch {
        // Cancellation succeeded even if refreshing details fails.
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel registration."
      );
    } finally {
      setProcessing(false);
    }
  }


  if (loading) {
    return (
      <div className="workspace-page">
        <p>Loading conference details...</p>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="workspace-page">
        <Link to="/conferences" className="back-link">
          <ArrowLeft size={17} />
          Back to conferences
        </Link>

        <div className="empty-state">
          <AlertCircle size={32} />
          <h3>Conference unavailable</h3>
          <p className="page-error">{error || "Conference not found."}</p>

          <button
            className="secondary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const registeredCount = conference._count.registrations;
  const capacity = conference.capacity;

  const availableSeats = Math.max(0, capacity - registeredCount);

  const fullyBooked = availableSeats === 0;

  const occupancyPercentage =
    capacity > 0
      ? Math.min(100, Math.round((registeredCount / capacity) * 100))
      : 0;

  const isPast = new Date(conference.endsAt).getTime() < Date.now();

  const isAttendee = user?.role === "ATTENDEE";
  const canRegister =
    Boolean(user) && isAttendee && !registered && !fullyBooked && !isPast;

  return (
    <div className="workspace-page">
      <Link to="/conferences" className="back-link">
        <ArrowLeft size={17} />
        Back to conferences
      </Link>

      {conferenceImageUrl(conference.imageUrl) && (
        <div className="event-details-cover">
          <img
            src={conferenceImageUrl(conference.imageUrl)!}
            alt={`Cover for ${conference.title}`}
          />
        </div>
      )}

      <div className="details-hero">
        <span
          className={
            isPast
              ? "status-pill status-archived"
              : "status-pill status-published"
          }
        >
          {isPast ? "Past event" : "Published event"}
        </span>

        <h1>{conference.title}</h1>

        <p>
          {conference.description ||
            "Discover this conference and connect with the community."}
        </p>

        <div className="details-hero-meta">
          <span>
            <CalendarDays size={18} />
            {formatDate(conference.startsAt)}
          </span>

          <span>
            <Clock3 size={18} />
            {formatDateTime(conference.startsAt)}
          </span>

          <span>
            <MapPin size={18} />
            {conference.location}
          </span>
        </div>
      </div>

      <div className="details-layout">
        <div className="details-content">
          <section className="details-section">
            <h2>About this conference</h2>

            <p>
              {conference.description ||
                "No additional description is available."}
            </p>

            <div className="conference-detail-facts">
              <div>
                <CalendarDays size={19} />
                <div>
                  <strong>Starts</strong>
                  <span>{formatDateTime(conference.startsAt)}</span>
                </div>
              </div>

              <div>
                <Clock3 size={19} />
                <div>
                  <strong>Ends</strong>
                  <span>{formatDateTime(conference.endsAt)}</span>
                </div>
              </div>

              <div>
                <MapPin size={19} />
                <div>
                  <strong>Location</strong>
                  <span>{conference.location}</span>
                </div>
              </div>

              <div>
                <Users size={19} />
                <div>
                  <strong>Capacity</strong>
                  <span>{capacity} attendees</span>
                </div>
              </div>
            </div>
          </section>

          <section className="details-section">
            <h2>Conference sessions</h2>

            <div className="program-reservation-actions">
              <Link
                to={`/conferences/${id}/program`}
                className="schedule-secondary-button"
              >
                View Full Program
              </Link>
              {isAttendee && (
                <Link to="/my-schedule" className="schedule-secondary-button">
                  My Schedule
                </Link>
              )}
            </div>

            {reservationMessage && (
              <p className="success-message" role="status">
                {reservationMessage}
              </p>
            )}
            {reservationError && (
              <p className="page-error" role="alert">
                {reservationError}
              </p>
            )}

            {conference.talks.length === 0 ? (
              <div className="sessions-empty">
                <CalendarDays size={27} />
                <h3>Schedule coming soon</h3>
                <p>
                  Sessions and speakers will appear here once the organizer
                  prepares the program.
                </p>
              </div>
            ) : (
              <div className="sessions-list">
                {conference.talks.map((talk) => (
                  <article className="session-item" key={talk.id}>
                    <h3>{talk.title}</h3>
                    <p>{talk.description}</p>

                    <div className="session-meta">
                      <span>
                        <UserRound size={15} />
                        {talk.speaker.firstName} {talk.speaker.lastName}
                      </span>

                      {talk.startsAt && (
                        <span>
                          <Clock3 size={15} />
                          {formatDateTime(talk.startsAt)}
                        </span>
                      )}

                      {talk.room && (
                        <span>
                          <MapPin size={15} />
                          {talk.room.name}
                        </span>
                      )}
                    </div>

                    {talk.startsAt && talk.endsAt && (
                      <p className="session-time-range">
                        {formatDateTime(talk.startsAt)}
                        {" – "}
                        {formatDateTime(talk.endsAt)}
                      </p>
                    )}

                    {isAttendee &&
                      registered &&
                      talk.startsAt &&
                      talk.endsAt &&
                      talk.room && (
                        <div className="program-reservation-actions">
                          <button
                            type="button"
                            className="schedule-primary-button"
                            disabled={
                              busyTalkId !== null ||
                              processing ||
                              new Date(talk.startsAt).getTime() <= Date.now()
                            }
                            onClick={() => setSelectedTalkId(talk.id)}
                          >
                            {new Date(talk.startsAt).getTime() <= Date.now()
                              ? "Reservation Closed"
                              : reservedTalkIds.includes(talk.id)
                              ? "Manage Seat"
                              : "Choose Seat"}
                          </button>
                          {reservedTalkIds.includes(talk.id) && (
                            <span className="my-schedule-status">Reserved</span>
                          )}
                        </div>
                      )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="details-sidebar">
          <div className="registration-card">
            <div className="registration-card-heading">
              <h3>Event registration</h3>

              <button
                className="registration-refresh"
                type="button"
                onClick={() => void refreshConference()}
                disabled={processing}
                title="Refresh availability"
                aria-label="Refresh availability"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            <p>Secure your place at this conference.</p>

            <div className="registration-capacity">
              <div className="registration-capacity-numbers">
                <strong>
                  {registeredCount} / {capacity}
                </strong>

                <span>attendees registered</span>
              </div>

              <div
                className="registration-progress"
                role="progressbar"
                aria-label="Conference occupancy"
                aria-valuenow={registeredCount}
                aria-valuemin={0}
                aria-valuemax={capacity}
              >
                <div
                  className="registration-progress-fill"
                  style={{
                    width: `${occupancyPercentage}%`,
                  }}
                />
              </div>

              <p
                className={
                  fullyBooked
                    ? "registration-availability is-full"
                    : "registration-availability"
                }
              >
                {fullyBooked
                  ? "Fully booked"
                  : `${availableSeats} seats available`}
              </p>
            </div>

            <div className="registration-info">
              <span>
                <Users size={18} />
                {registeredCount} registered
              </span>

              <span>
                <UserRound size={18} />
                Organized by {conference.organizer?.firstName}{" "}
                {conference.organizer?.lastName}
              </span>
            </div>

            {registered ? (
              <>
                <div className="registered-state">
                  <CheckCircle2 size={19} />
                  You're registered
                </div>

                <button
                  className="registration-cancel-button"
                  type="button"
                  disabled={processing}
                  onClick={() => void handleCancelRegistration()}
                >
                  <XCircle size={17} />
                  {processing ? "Cancelling..." : "Cancel registration"}
                </button>
              </>
            ) : !user ? (
              <Link className="action-button registration-button" to="/login">
                Log in to register
              </Link>
            ) : !isAttendee ? (
              <p className="registration-notice">
                Registration is available for attendee accounts only.
              </p>
            ) : isPast ? (
              <button className="action-button registration-button" disabled>
                Event has ended
              </button>
            ) : fullyBooked ? (
              <button className="action-button registration-button" disabled>
                Fully booked
              </button>
            ) : (
              <button
                className="action-button registration-button"
                type="button"
                disabled={!canRegister || processing}
                onClick={() => void handleRegister()}
              >
                {processing ? "Registering..." : "Register for conference"}
              </button>
            )}

            {message && (
              <p className="success-message" role="status">
                {message}
              </p>
            )}

            {error && (
              <p className="page-error" role="alert">
                {error}
              </p>
            )}
          </div>
          </aside>
      </div>

      {/* Seat selection modal */}
      {selectedTalkId && (
        <SeatPicker
          talkId={selectedTalkId}
          onClose={() => setSelectedTalkId(null)}
          onUpdated={async () => {
            if (!id) return;

            const data = await getConferenceReservations(id);
            setReservedTalkIds(data.talkIds);
          }}
        />
      )}
    </div>
  );
}