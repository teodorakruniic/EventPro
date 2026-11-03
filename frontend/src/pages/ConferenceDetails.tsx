
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import {
  getConferenceDetails,
  getConferenceRegistration,
  registerForConference,
  type ConferenceDetails as ConferenceDetailsType,
} from "../services/conferences";
import { useAuth } from "../context/AuthContext";

export default function ConferenceDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [conference, setConference] =
    useState<ConferenceDetailsType | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid conference ID.");
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        const [details, registration] = await Promise.all([
          getConferenceDetails(id!),
          user
            ? getConferenceRegistration(id!)
            : Promise.resolve({ registered: false }),
        ]);

        if (active) {
          setConference(details);
          setRegistered(registration.registered);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conference."
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
  }, [id, user?.id]);

  async function handleRegister() {
    if (!id || registered || registering) return;

    setRegistering(true);
    setError("");
    setMessage("");

    try {
      await registerForConference(id);

      setRegistered(true);
      setMessage("You have successfully registered!");

      const updated = await getConferenceDetails(id);
      setConference(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <p>Loading conference details...</p>;
  }

  if (!conference) {
    return (
      <div className="workspace-page">
        <Link to="/conferences" className="back-link">
          <ArrowLeft size={17} />
          Back to conferences
        </Link>
        <p className="page-error">
          {error || "Conference not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <Link to="/conferences" className="back-link">
        <ArrowLeft size={17} />
        Back to conferences
      </Link>

      <div className="details-hero">
        <span className="status-pill status-published">
          Published event
        </span>

        <h1>{conference.title}</h1>

        <p>
          {conference.description ||
            "Discover this conference and connect with the community."}
        </p>

        <div className="details-hero-meta">
          <span>
            <CalendarDays size={18} />
            {new Date(conference.startsAt).toLocaleDateString("en-GB")}
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
          </section>

          <section className="details-section">
            <h2>Conference sessions</h2>

            {conference.talks.length === 0 ? (
              <div className="sessions-empty">
                <CalendarDays size={27} />
                <h3>Schedule coming soon</h3>
                <p>
                  Sessions and speakers will appear here once
                  the organizer publishes the program.
                </p>
              </div>
            ) : (
              <div className="sessions-list">
                {conference.talks.map((talk) => (
                  <article
                    className="session-item"
                    key={talk.id}
                  >
                    <h3>{talk.title}</h3>
                    <p>{talk.description}</p>

                    <div className="session-meta">
                      <span>
                        <UserRound size={15} />
                        {talk.speaker.firstName}{" "}
                        {talk.speaker.lastName}
                      </span>

                      {talk.startsAt && (
                        <span>
                          <Clock3 size={15} />
                          {new Date(
                            talk.startsAt
                          ).toLocaleString("en-GB")}
                        </span>
                      )}

                      {talk.room && (
                        <span>
                          <MapPin size={15} />
                          {talk.room.name}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="details-sidebar">
          <div className="registration-card">
            <h3>Event registration</h3>
            <p>
              Secure your place at this conference.
            </p>

            <div className="registration-info">
              <span>
                <Users size={18} />
                {conference._count.registrations} registered
              </span>

              <span>
                <UserRound size={18} />
                Organized by{" "}
                {conference.organizer?.firstName}{" "}
                {conference.organizer?.lastName}
              </span>
            </div>

            {registered ? (
              <div className="registered-state">
                <CheckCircle2 size={19} />
                You're registered
              </div>
            ) : (
              <button
                className="action-button registration-button"
                disabled={registering}
                onClick={() => void handleRegister()}
              >
                {registering
                  ? "Registering..."
                  : "Register for conference"}
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
    </div>
  );
}
