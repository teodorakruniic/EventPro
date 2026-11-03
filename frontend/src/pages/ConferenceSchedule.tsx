
import {
    useCallback,
    useEffect,
    useState,
    type FormEvent,
  } from "react";
  import { Link, useSearchParams } from "react-router-dom";
  import {
    CalendarClock,
    DoorOpen,
    Plus,
    Trash2,
    Clock3,
    MapPin,
    Users,
    Pencil,
    X,
    RefreshCw,
  } from "lucide-react";
  
  import {
    getMyConferences,
    type Conference,
  } from "../services/conferences";
  
  import {
    getManageRooms,
    getManageTalks,
    createRoom,
    deleteRoom,
    scheduleTalk,
    unscheduleTalk,
    type Room,
    type ScheduledTalk,
  } from "../services/schedule";
  
  function toLocalInput(iso: string | null) {
    if (!iso) return "";
  
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
  
    const local = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
  
    return local.toISOString().slice(0, 16);
  }
  
  function formatDate(value: string) {
    return new Date(value).toLocaleString("sl-SI", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  
  export default function ConferenceSchedule() {
    const [params, setParams] = useSearchParams();
    const conferenceId = params.get("conference") ?? "";
  
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [talks, setTalks] = useState<ScheduledTalk[]>([]);
  
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
  
    const [roomName, setRoomName] = useState("");
    const [roomCapacity, setRoomCapacity] = useState(50);
  
    const [editingTalk, setEditingTalk] =
      useState<ScheduledTalk | null>(null);
  
    const [selectedRoom, setSelectedRoom] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
  
    const selectedConference = conferences.find(
      (conference) => conference.id === conferenceId
    );
  
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
  
    const loadData = useCallback(async () => {
      if (!conferenceId) {
        setRooms([]);
        setTalks([]);
        setLoading(false);
        return;
      }
  
      setLoading(true);
      setError("");
  
      try {
        const [roomData, talkData] = await Promise.all([
          getManageRooms(conferenceId),
          getManageTalks(conferenceId),
        ]);
  
        setRooms(roomData);
        setTalks(talkData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load conference schedule."
        );
      } finally {
        setLoading(false);
      }
    }, [conferenceId]);
  
    useEffect(() => {
      void loadConferences();
    }, [loadConferences]);
  
    useEffect(() => {
      void loadData();
    }, [loadData]);
  
    async function handleCreateRoom(event: FormEvent) {
      event.preventDefault();
  
      if (!conferenceId || !roomName.trim()) return;
  
      setSaving(true);
      setError("");
      setSuccess("");
  
      try {
        await createRoom(conferenceId, {
          name: roomName.trim(),
          capacity: roomCapacity,
        });
  
        setRoomName("");
        setRoomCapacity(50);
        setSuccess("Room created successfully.");
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to create room."
        );
      } finally {
        setSaving(false);
      }
    }
  
    async function handleDeleteRoom(room: Room) {
      if (
        !window.confirm(
          `Delete room "${room.name}"?`
        )
      ) {
        return;
      }
  
      setSaving(true);
      setError("");
      setSuccess("");
  
      try {
        await deleteRoom(room.id);
        setSuccess("Room deleted successfully.");
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete room."
        );
      } finally {
        setSaving(false);
      }
    }
  
    function openScheduleForm(talk: ScheduledTalk) {
      setEditingTalk(talk);
      setSelectedRoom(talk.roomId ?? rooms[0]?.id ?? "");
      setStartsAt(toLocalInput(talk.startsAt));
      setEndsAt(toLocalInput(talk.endsAt));
      setError("");
      setSuccess("");
    }
  
    function closeScheduleForm() {
      setEditingTalk(null);
      setSelectedRoom("");
      setStartsAt("");
      setEndsAt("");
    }
  
    async function handleSchedule(event: FormEvent) {
      event.preventDefault();
  
      if (
        !editingTalk ||
        !selectedRoom ||
        !startsAt ||
        !endsAt
      ) {
        return;
      }
  
      const start = new Date(startsAt);
      const end = new Date(endsAt);
  
      if (start >= end) {
        setError("End time must be after start time.");
        return;
      }
  
      setSaving(true);
      setError("");
      setSuccess("");
  
      try {
        await scheduleTalk(editingTalk.id, {
          roomId: selectedRoom,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        });
  
        closeScheduleForm();
        setSuccess("Talk scheduled successfully.");
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to schedule talk."
        );
      } finally {
        setSaving(false);
      }
    }
  
    async function handleUnschedule(talk: ScheduledTalk) {
      if (
        !window.confirm(
          `Remove "${talk.title}" from the schedule?`
        )
      ) {
        return;
      }
  
      setSaving(true);
      setError("");
      setSuccess("");
  
      try {
        await unscheduleTalk(talk.id);
        setSuccess("Talk removed from schedule.");
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove schedule."
        );
      } finally {
        setSaving(false);
      }
    }
  
    const scheduled = talks
      .filter(
        (talk) =>
          talk.roomId &&
          talk.startsAt &&
          talk.endsAt
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt!).getTime() -
          new Date(b.startsAt!).getTime()
      );
  
    const unscheduled = talks.filter(
      (talk) =>
        !talk.roomId ||
        !talk.startsAt ||
        !talk.endsAt
    );
  
    return (
      <div className="workspace-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ORGANIZER PORTAL</span>
            <h1>Conference Schedule</h1>
            <p>
              Manage rooms, assign sessions, and prevent
              scheduling conflicts.
            </p>
          </div>
  
          <Link
            to="/my-conferences"
            className="schedule-secondary-button"
          >
            My Conferences
          </Link>
        </div>
  
        <div className="schedule-toolbar">
          <div className="schedule-field">
            <label htmlFor="schedule-conference">
              Select conference
            </label>
  
            <select
              id="schedule-conference"
              value={conferenceId}
              onChange={(event) => {
                setError("");
                setSuccess("");
                closeScheduleForm();
                setParams({
                  conference: event.target.value,
                });
              }}
            >
              <option value="">Select conference</option>
  
              {conferences.map((conference) => (
                <option
                  key={conference.id}
                  value={conference.id}
                >
                  {conference.title}
                </option>
              ))}
            </select>
          </div>
  
          <button
            type="button"
            className="schedule-icon-button"
            onClick={() => void loadData()}
            disabled={loading || saving}
            title="Refresh schedule"
          >
            <RefreshCw size={18} />
          </button>
        </div>
  
        {selectedConference && (
          <div className="schedule-conference-info">
            <span>
              <CalendarClock size={16} />
              {formatDate(selectedConference.startsAt)}
            </span>
  
            <span>
              <MapPin size={16} />
              {selectedConference.location}
            </span>
          </div>
        )}
  
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
  
        {!conferenceId ? (
          <div className="schedule-empty">
            Select a conference to manage its program.
          </div>
        ) : loading ? (
          <p>Loading conference schedule...</p>
        ) : (
          <>
            <div className="schedule-stats">
              <div className="schedule-stat">
                <span>Rooms</span>
                <strong>{rooms.length}</strong>
              </div>
  
              <div className="schedule-stat">
                <span>Accepted talks</span>
                <strong>{talks.length}</strong>
              </div>
  
              <div className="schedule-stat">
                <span>Scheduled</span>
                <strong>{scheduled.length}</strong>
              </div>
  
              <div className="schedule-stat">
                <span>Unscheduled</span>
                <strong>{unscheduled.length}</strong>
              </div>
            </div>
  
            <section className="schedule-panel">
              <div className="schedule-section-heading">
                <div>
                  <h2>
                    <DoorOpen size={21} />
                    Conference Rooms
                  </h2>
                  <p>
                    Create rooms and define their seating capacity.
                  </p>
                </div>
              </div>
  
              <form
                className="schedule-room-form"
                onSubmit={handleCreateRoom}
              >
                <div className="schedule-field">
                  <label htmlFor="room-name">Room name</label>
                  <input
                    id="room-name"
                    value={roomName}
                    onChange={(event) =>
                      setRoomName(event.target.value)
                    }
                    placeholder="e.g. Main Hall"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
  
                <div className="schedule-field">
                  <label htmlFor="room-capacity">
                    Capacity
                  </label>
                  <input
                    id="room-capacity"
                    type="number"
                    min={1}
                    max={100000}
                    value={roomCapacity}
                    onChange={(event) =>
                      setRoomCapacity(Number(event.target.value))
                    }
                    required
                  />
                </div>
  
                <button
                  type="submit"
                  className="schedule-primary-button"
                  disabled={saving}
                >
                  <Plus size={17} />
                  Add Room
                </button>
              </form>
  
              <div className="schedule-room-grid">
                {rooms.map((room) => (
                  <div
                    className="schedule-room-card"
                    key={room.id}
                  >
                    <div className="schedule-room-icon">
                      <DoorOpen size={21} />
                    </div>
  
                    <div className="schedule-room-details">
                      <strong>{room.name}</strong>
                      <span>
                        <Users size={14} />
                        {room.capacity} seats
                      </span>
                      <span>
                        {room._count?.talks ?? 0} assigned talks
                      </span>
                    </div>
  
                    <button
                      type="button"
                      className="schedule-delete-button"
                      onClick={() =>
                        void handleDeleteRoom(room)
                      }
                      disabled={saving}
                      title="Delete room"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
  
                {rooms.length === 0 && (
                  <p className="schedule-muted">
                    No rooms created yet.
                  </p>
                )}
              </div>
            </section>
  
            <section className="schedule-panel">
              <div className="schedule-section-heading">
                <div>
                  <h2>
                    <Clock3 size={21} />
                    Unscheduled Talks
                  </h2>
                  <p>
                    Assign a room and time to accepted proposals.
                  </p>
                </div>
              </div>
  
              {unscheduled.length === 0 ? (
                <div className="schedule-empty">
                  All accepted talks have been scheduled.
                </div>
              ) : (
                <div className="schedule-talk-list">
                  {unscheduled.map((talk) => (
                    <div
                      className="schedule-talk-row"
                      key={talk.id}
                    >
                      <div>
                        <h3>{talk.title}</h3>
                        <p>
                          {talk.speaker.firstName}{" "}
                          {talk.speaker.lastName}
                        </p>
                      </div>
  
                      <button
                        type="button"
                        className="schedule-primary-button"
                        onClick={() =>
                          openScheduleForm(talk)
                        }
                        disabled={rooms.length === 0 || saving}
                      >
                        <CalendarClock size={16} />
                        Schedule
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
  
            <section className="schedule-panel">
              <div className="schedule-section-heading">
                <div>
                  <h2>
                    <CalendarClock size={21} />
                    Scheduled Talks
                  </h2>
                  <p>
                    Review and manage the conference program.
                  </p>
                </div>
  
                {selectedConference?.status === "PUBLISHED" && (
                  <Link
                    to={`/conferences/${conferenceId}/program`}
                    className="schedule-secondary-button"
                  >
                    View public program
                  </Link>
                )}
              </div>
  
              {scheduled.length === 0 ? (
                <div className="schedule-empty">
                  No talks have been scheduled yet.
                </div>
              ) : (
                <div className="schedule-talk-list">
                  {scheduled.map((talk) => (
                    <div
                      className="schedule-talk-row"
                      key={talk.id}
                    >
                      <div>
                        <h3>{talk.title}</h3>
                        <p>
                          {talk.speaker.firstName}{" "}
                          {talk.speaker.lastName}
                        </p>
  
                        <div className="schedule-talk-meta">
                          <span>
                            <Clock3 size={15} />
                            {formatDate(talk.startsAt!)}
                            {" – "}
                            {new Date(
                              talk.endsAt!
                            ).toLocaleTimeString("sl-SI", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
  
                          <span>
                            <DoorOpen size={15} />
                            {talk.room?.name}
                          </span>
                        </div>
                      </div>
  
                      <div className="schedule-row-actions">
                        <button
                          type="button"
                          className="schedule-secondary-button"
                          onClick={() =>
                            openScheduleForm(talk)
                          }
                          disabled={saving}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
  
                        <button
                          type="button"
                          className="schedule-danger-button"
                          onClick={() =>
                            void handleUnschedule(talk)
                          }
                          disabled={saving}
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
  
        {editingTalk && (
          <div className="schedule-modal-backdrop">
            <div
              className="schedule-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-modal-title"
            >
              <div className="schedule-modal-header">
                <div>
                  <span className="eyebrow">
                    SESSION PLANNING
                  </span>
                  <h2 id="schedule-modal-title">
                    Schedule Talk
                  </h2>
                  <p>{editingTalk.title}</p>
                </div>
  
                <button
                  type="button"
                  className="schedule-icon-button"
                  onClick={closeScheduleForm}
                  disabled={saving}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
  
              <form onSubmit={handleSchedule}>
                <div className="schedule-field">
                  <label htmlFor="talk-room">
                    Room
                  </label>
                  <select
                    id="talk-room"
                    value={selectedRoom}
                    onChange={(event) =>
                      setSelectedRoom(event.target.value)
                    }
                    required
                  >
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option
                        key={room.id}
                        value={room.id}
                      >
                        {room.name} ({room.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
  
                <div className="schedule-field">
                  <label htmlFor="talk-start">
                    Start date and time
                  </label>
                  <input
                    id="talk-start"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) =>
                      setStartsAt(event.target.value)
                    }
                    required
                  />
                </div>
  
                <div className="schedule-field">
                  <label htmlFor="talk-end">
                    End date and time
                  </label>
                  <input
                    id="talk-end"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) =>
                      setEndsAt(event.target.value)
                    }
                    required
                  />
                </div>
  
                <div className="schedule-modal-actions">
                  <button
                    type="button"
                    className="schedule-secondary-button"
                    onClick={closeScheduleForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
  
                  <button
                    type="submit"
                    className="schedule-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
  