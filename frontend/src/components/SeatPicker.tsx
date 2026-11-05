import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Armchair,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { API_URL } from "../services/api";
import "./SeatPicker.css";

type SeatData =
  | string
  | {
      seatNumber?: string;
      number?: string;
      label?: string;
      status?: string;
      isOccupied?: boolean;
      isMine?: boolean;
    };

interface SeatMapResponse {
  talkId: string;
  roomName?: string;
  capacity: number;
  seats: SeatData[];
  occupiedSeats?: string[];
  mySeat: string | null;
  hasReservation?: boolean;
  legacyReservations?: number;
  reservationClosed?: boolean;
}

interface WaitlistResponse {
  talkId: string;
  capacity: number;
  reservedCount: number;
  isFull: boolean;
  waitlistCount: number;
  isWaitlisted: boolean;
  position: number | null;
  hasReservation: boolean;
  reservationClosed: boolean;
}

interface SeatPickerProps {
  talkId: string;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
}

interface NormalizedSeat {
  number: string;
  occupied: boolean;
  mine: boolean;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body != null) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/reservations${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Cannot connect to the server.");
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return data as T;
}

function normalizeSeats(data: SeatMapResponse): NormalizedSeat[] {
  const occupied = new Set(data.occupiedSeats ?? []);
  return data.seats.flatMap((seat) => {
    const number =
      typeof seat === "string"
        ? seat
        : seat.seatNumber ?? seat.number ?? seat.label;
    if (!number) return [];
    const details = typeof seat === "string" ? null : seat;
    const mine =
      number === data.mySeat ||
      details?.isMine === true ||
      details?.status === "MINE";
    return [
      {
        number,
        mine,
        occupied:
          !mine &&
          (occupied.has(number) ||
            details?.isOccupied === true ||
            details?.status === "OCCUPIED"),
      },
    ];
  });
}

export default function SeatPicker({
  talkId,
  onClose,
  onUpdated,
}: SeatPickerProps) {
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistResponse | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const path = `/talks/${encodeURIComponent(talkId)}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [seats, queue] = await Promise.all([
        request<SeatMapResponse>(`/talks/${encodeURIComponent(talkId)}/seats`),
        request<WaitlistResponse>(
          `/talks/${encodeURIComponent(talkId)}/waitlist`
        ),
      ]);
      setSeatMap(seats);
      setWaitlist(queue);
      setSelectedSeat(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load seat information."
      );
    } finally {
      setLoading(false);
    }
  }, [talkId]);

  useEffect(() => {
    setSeatMap(null);
    setWaitlist(null);
    setMessage("");
    void loadData();
  }, [loadData]);

  const seats = useMemo(
    () => (seatMap ? normalizeSeats(seatMap) : []),
    [seatMap]
  );
  const occupiedCount = seats.filter((seat) => seat.occupied).length;
  const availableCount = seats.filter(
    (seat) => !seat.occupied && !seat.mine
  ).length;
  const hasReservation = seatMap?.hasReservation ?? Boolean(seatMap?.mySeat);
  const closed =
    seatMap?.reservationClosed === true || waitlist?.reservationClosed === true;
  const isFull = waitlist?.isFull === true;
  const isWaitlisted = waitlist?.isWaitlisted === true;

  async function runAction(
    action: () => Promise<unknown>,
    successText: string
  ) {
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      await action();
      await loadData();
      await onUpdated?.();
      setMessage(successText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed.");
      await loadData();
    } finally {
      setProcessing(false);
    }
  }

  function handleReservation() {
    if (!selectedSeat || !seatMap || processing || closed || isWaitlisted)
      return;
    const chosen = seats.find((seat) => seat.number === selectedSeat);
    if (!chosen || chosen.occupied || chosen.mine) return;
    const change = hasReservation;
    void runAction(
      () =>
        request(change ? `${path}/seat` : path, {
          method: change ? "PATCH" : "POST",
          body: JSON.stringify({ seatNumber: selectedSeat }),
        }),
      change ? "Seat changed successfully." : "Seat reserved successfully."
    );
  }

  function handleCancel() {
    if (!hasReservation || processing) return;
    if (!window.confirm("Are you sure you want to cancel your reservation?"))
      return;
    void runAction(
      () => request(path, { method: "DELETE" }),
      "Reservation cancelled successfully. If someone was waiting, the seat may have been assigned automatically."
    );
  }

  function handleJoinWaitlist() {
    if (processing || closed || hasReservation || isWaitlisted || !isFull)
      return;
    void runAction(
      () => request(`${path}/waitlist`, { method: "POST" }),
      "You have joined the waitlist successfully."
    );
  }

  function handleLeaveWaitlist() {
    if (processing || !isWaitlisted) return;
    if (!window.confirm("Leave the waitlist for this session?")) return;
    void runAction(
      () => request(`${path}/waitlist`, { method: "DELETE" }),
      "You have left the waitlist."
    );
  }

  return (
    <div
      className="seat-picker-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="seat-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose your seat"
      >
        <div className="seat-picker-header">
          <div>
            <span className="eyebrow">SEAT RESERVATION</span>
            <h2>Choose Your Seat</h2>
            {seatMap?.roomName && <p>{seatMap.roomName}</p>}
          </div>
          <button
            type="button"
            className="seat-picker-close"
            onClick={onClose}
            aria-label="Close seat picker"
          >
            <X size={22} />
          </button>
        </div>

        {loading && !seatMap && <p>Loading seats...</p>}
        {seatMap && waitlist && (
          <>
            <div className="seat-picker-summary">
              <span>
                <strong>{seatMap.capacity}</strong> Total seats
              </span>
              <span>
                <strong>{occupiedCount}</strong> Occupied
              </span>
              <span>
                <strong>{availableCount}</strong> Available
              </span>
              <span>
                <strong>{waitlist.waitlistCount}</strong> Waiting
              </span>
            </div>
            <div className="seat-picker-stage">STAGE / SPEAKER</div>
            {seats.length ? (
              <div className="seat-picker-grid">
                {seats.map((seat) => {
                  const selected = selectedSeat === seat.number;
                  return (
                    <button
                      key={seat.number}
                      type="button"
                      title={`Seat ${seat.number}`}
                      aria-label={`Seat ${seat.number}${
                        seat.occupied
                          ? ", occupied"
                          : seat.mine
                          ? ", your seat"
                          : ", available"
                      }`}
                      aria-pressed={selected || seat.mine}
                      disabled={
                        seat.occupied ||
                        processing ||
                        loading ||
                        closed ||
                        isWaitlisted
                      }
                      className={[
                        "seat-picker-seat",
                        seat.occupied ? "occupied" : "",
                        seat.mine ? "mine" : "",
                        selected ? "selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedSeat(seat.number)}
                    >
                      <Armchair size={21} />
                      <span>{seat.number}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="seat-picker-error">
                No seats were returned by the server.
              </p>
            )}

            <div className="seat-picker-legend">
              <span>⬜ Available</span>
              <span>🟩 Selected</span>
              <span>⬛ Occupied</span>
              <span>🟦 Your seat</span>
            </div>

            {seatMap.mySeat && (
              <p className="seat-picker-current">
                <CheckCircle2 size={18} /> Your current seat:{" "}
                <strong>{seatMap.mySeat}</strong>
              </p>
            )}
            {hasReservation && !seatMap.mySeat && (
              <p className="seat-picker-current">
                You have a reservation without an assigned seat. Select an
                available seat to assign one.
              </p>
            )}
            {selectedSeat && (
              <p className="seat-picker-current">
                Selected seat: <strong>{selectedSeat}</strong>
              </p>
            )}
            {closed && (
              <p className="seat-picker-error">
                <AlertCircle size={16} /> Reservations and waitlist are closed
                for this talk.
              </p>
            )}

            {!hasReservation && !closed && (isFull || isWaitlisted) && (
              <section
                className="seat-picker-waitlist"
                aria-label="Session waitlist"
              >
                <div className="seat-picker-waitlist-heading">
                  <Users size={21} />
                  <div>
                    <strong>
                      {isWaitlisted
                        ? "You're on the waitlist"
                        : "This session is fully booked"}
                    </strong>
                    <p>
                      {isWaitlisted
                        ? "If a seat becomes available and you are eligible, it will be assigned automatically."
                        : "Join the waitlist to be considered when a seat becomes available."}
                    </p>
                  </div>
                </div>
                {isWaitlisted ? (
                  <>
                    <div className="seat-picker-waitlist-position">
                      <Clock3 size={17} /> Your position:{" "}
                      <strong>#{waitlist.position ?? "—"}</strong>
                    </div>
                    <button
                      type="button"
                      className="seat-picker-waitlist-leave"
                      onClick={handleLeaveWaitlist}
                      disabled={processing || loading}
                    >
                      Leave Waitlist
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="seat-picker-waitlist-join"
                    onClick={handleJoinWaitlist}
                    disabled={processing || loading}
                  >
                    Join Waitlist
                  </button>
                )}
              </section>
            )}

            {error && (
              <p className="seat-picker-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="seat-picker-success" role="status">
                {message}
              </p>
            )}
            <div className="seat-picker-actions">
              <button
                type="button"
                className="secondary-button seat-picker-refresh"
                onClick={() => void loadData()}
                disabled={loading || processing}
              >
                <RefreshCw size={16} /> Refresh
              </button>
              {hasReservation && !closed && (
                <button
                  type="button"
                  className="secondary-button seat-picker-cancel"
                  onClick={handleCancel}
                  disabled={processing || loading}
                >
                  Cancel Reservation
                </button>
              )}
              {!isWaitlisted && !(!hasReservation && isFull) && (
                <button
                  type="button"
                  className="primary-button seat-picker-confirm"
                  onClick={handleReservation}
                  disabled={
                    !selectedSeat ||
                    processing ||
                    loading ||
                    closed ||
                    selectedSeat === seatMap.mySeat
                  }
                >
                  {processing
                    ? "Saving..."
                    : hasReservation
                    ? "Change Seat"
                    : "Confirm Reservation"}
                </button>
              )}
            </div>
          </>
        )}
        {!seatMap && error && (
          <div>
            <p className="seat-picker-error" role="alert">
              {error}
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadData()}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
