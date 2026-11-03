
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

import {
  getConferenceProgram,
  type ConferenceProgram as ProgramData,
  type ScheduledTalk,
} from "../services/schedule";

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

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        setError("Conference ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setProgram(null);

      try {
        const data = await getConferenceProgram(id);

        if (active) {
          setProgram(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conference program."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

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
          <h1>{program?.conference.title ?? "Conference Program"}</h1>
          <p>Explore scheduled sessions, speakers, and rooms.</p>
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

          {groupedTalks.length === 0 ? (
            <div className="schedule-empty">
              <CalendarDays size={32} />
              <h3>Program coming soon</h3>
              <p>
                The organizer has not published any scheduled
                sessions yet.
              </p>
            </div>
          ) : (
            <div className="program-days">
              {groupedTalks.map((group) => (
                <section className="schedule-panel" key={group.day}>
                  <div className="schedule-section-heading">
                    <div>
                      <h2>
                        <CalendarDays size={21} />
                        {formatDay(group.talks[0].startsAt!)}
                      </h2>
                      <p>{group.talks.length} scheduled sessions</p>
                    </div>
                  </div>

                  <div className="program-session-list">
                    {group.talks.map((talk) => (
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
                        </div>
                      </article>
                    ))}
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
