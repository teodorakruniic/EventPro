
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  DoorOpen,
  MapPin,
  Mic2,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getConferenceProgram,
  type ConferenceProgram as ProgramData,
  type ScheduledTalk,
} from "../services/schedule";
import {
  getConferenceReservations,
  reserveTalk,
  cancelReservation,
} from "../services/reservations";

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dayKey(value: string) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function ConferenceProgram() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAttendee = user?.role === "ATTENDEE";

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [reservedTalkIds, setReservedTalkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTalkId, setBusyTalkId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");
      setProgram(null);
      setReservedTalkIds([]);

      if (!id) {
        setError("Conference ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const [programData, reservationData] = await Promise.all([
          getConferenceProgram(id),
          isAttendee
            ? getConferenceReservations(id)
            : Promise.resolve({ talkIds: [] }),
        ]);

        if (!active) return;

        setProgram(programData);
        setReservedTalkIds(reservationData.talkIds);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load conference program."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id, isAttendee]);

  async function handleReservation(talk: ScheduledTalk) {
    const alreadyReserved = reservedTalkIds.includes(talk.id);

    setBusyTalkId(talk.id);
    setError("");
    setSuccess("");

    try {
      if (alreadyReserved) {
        await cancelReservation(talk.id);

        setReservedTalkIds((current) =>
          current.filter((talkId) => talkId !== talk.id)
        );

        setSuccess("Reservation cancelled successfully.");
      } else {
        await reserveTalk(talk.id);

        setReservedTalkIds((current) =>
          current.includes(talk.id)
            ? current
            : [...current, talk.id]
        );

        setSuccess("Seat reserved successfully.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update reservation."
      );
    } finally {
      setBusyTalkId(null);
    }
  }

  const groupedTalks = useMemo(() => {
    if (!program) return [];

    const groups = new Map<string, ScheduledTalk[]>();

    for (const talk of program.talks) {
      if (!talk.startsAt || !talk.endsAt) continue;

      const key = dayKey(talk.startsAt);
      const existing = groups.get(key) ?? [];

      existing.push(talk);
      groups.set(key, existing);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, talks]) => ({
        day,
        talks: talks.sort(
          (a, b) =>
            new Date(a.startsAt!).getTime() -
            new Date(b.startsAt!).getTime()
        ),
      }));
  }, [program]);

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONFERENCE PROGRAM</span>
          <h1>
            {program?.conference.title ?? "Conference Program"}
          </h1>
          <p>
            Explore scheduled sessions, speakers, and rooms.
          </p>
        </div>

        <Link
          to={id ? `/conferences/${id}` : "/conferences"}
          className="schedule-secondary-button"
        >
          <ArrowLeft size={16} />
          Back to conference
        </Link>
      </div>

      {loading && <p>Loading conference program...</p>}

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

      {!loading && program && (
        <>
          <div className="schedule-conference-info">
            <span>
              <CalendarDays size={17} />
              {formatDay(program.conference.startsAt)}
            </span>

            <span>
              <MapPin size={17} />
              {program.conference.location}
            </span>

            <span>
              <Mic2 size={17} />
              {program.talks.length} sessions
            </span>
          </div>

          {isAttendee && (
            <div className="program-attendee-toolbar">
              <p>
                Reserve sessions to build your personal schedule.
              </p>

              <Link
                to="/my-schedule"
                className="schedule-secondary-button"
              >
                <CalendarDays size={16} />
                My Schedule
              </Link>
            </div>
          )}

          {groupedTalks.length === 0 ? (
            <div className="schedule-empty">
              <CalendarDays size={32} />
              <h3>Program coming soon</h3>
              <p>
                The organizer has not scheduled any sessions yet.
              </p>
            </div>
          ) : (
            <div className="program-days">
              {groupedTalks.map((group) => (
                <section
                  className="schedule-panel"
                  key={group.day}
                >
                  <div className="schedule-section-heading">
                    <div>
                      <h2>
                        <CalendarDays size={21} />
                        {formatDay(
                          group.talks[0].startsAt!
                        )}
                      </h2>
                      <p>
                        {group.talks.length} scheduled sessions
                      </p>
                    </div>
                  </div>

                  <div className="program-session-list">
                    {group.talks.map((talk) => {
                      const reserved =
                        reservedTalkIds.includes(talk.id);

                      const started =
                        talk.startsAt !== null &&
                        new Date(talk.startsAt) <= new Date();

                      return (
                        <article
                          className="program-session"
                          key={talk.id}
                        >
                          <div className="program-session-time">
                            <Clock3 size={18} />
                            <strong>
                              {formatTime(talk.startsAt!)}
                            </strong>
                            <span>
                              {formatTime(talk.endsAt!)}
                            </span>
                          </div>

                          <div className="program-session-content">
                            <h3>{talk.title}</h3>
                            <p>{talk.description}</p>

                            <div className="schedule-talk-meta">
                              <span>
                                <Mic2 size={15} />
                                {talk.speaker.firstName}{" "}
                                {talk.speaker.lastName}
                              </span>

                              <span>
                                <DoorOpen size={15} />
                                {talk.room?.name ?? "Room TBA"}
                              </span>

                              {talk.room && (
                                <span>
                                  <Users size={15} />
                                  {talk.room.capacity} seats
                                </span>
                              )}
                            </div>

                            {isAttendee && (
                              <div className="program-reservation-actions">
                                <button
                                  type="button"
                                  className={
                                    reserved
                                      ? "schedule-danger-button"
                                      : "schedule-primary-button"
                                  }
                                  disabled={
                                    busyTalkId !== null ||
                                    (!reserved && started)
                                  }
                                  onClick={() =>
                                    void handleReservation(talk)
                                  }
                                >
                                  {busyTalkId === talk.id
                                    ? "Processing..."
                                    : reserved
                                      ? "Cancel Reservation"
                                      : started
                                        ? "Reservation Closed"
                                        : "Reserve Seat"}
                                </button>

                                {reserved && (
                                  <span className="my-schedule-status">
                                    Reserved
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
