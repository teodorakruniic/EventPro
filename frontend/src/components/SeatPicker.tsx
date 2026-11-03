
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Armchair,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import { API_URL } from "../services/api";
import "./SeatPicker.css";

interface SeatObject {
  seatNumber?: string;
  number?: string;
  label?: string;
  status?: string;
  isOccupied?: boolean;
  isMine?: boolean;
}

type SeatData = string | SeatObject;

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

interface NormalizedSeat {
  number: string;
  occupied: boolean;
  mine: boolean;
}

interface SeatPickerProps {
  talkId: string;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem("eventpro_token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body != null) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/reservations${path}`,
      { ...options, headers }
    );
  } catch {
    throw new Error("Cannot connect to the server.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed.";

    throw new Error(message);
  }

  return data as T;
}

function getSeatNumber(
  seat: SeatData
): string | null {
  if (typeof seat === "string") {
    return seat;
  }

  return (
    seat.seatNumber ??
    seat.number ??
    seat.label ??
    null
  );
}

function normalizeSeats(
  data: SeatMapResponse
): NormalizedSeat[] {
  const occupiedSet = new Set(
    data.occupiedSeats ?? []
  );

  return data.seats.flatMap((seat) => {
    const number = getSeatNumber(seat);

    if (!number) {
      return [];
    }

    const object =
      typeof seat === "string" ? null : seat;

    const mine =
      number === data.mySeat ||
      object?.isMine === true ||
      object?.status === "MINE";

    const occupied =
      !mine &&
      (
        occupiedSet.has(number) ||
        object?.isOccupied === true ||
        object?.status === "OCCUPIED"
      );

    return [
      {
        number,
        occupied,
        mine,
      },
    ];
  });
}

export default function SeatPicker({
  talkId,
  onClose,
  onUpdated,
}: SeatPickerProps) {
  const [seatMap, setSeatMap] =
    useState<SeatMapResponse | null>(null);

  const [selectedSeat, setSelectedSeat] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSeats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request<SeatMapResponse>(
        `/talks/${encodeURIComponent(talkId)}/seats`
      );

      setSeatMap(data);
      setSelectedSeat(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load seats."
      );
    } finally {
      setLoading(false);
    }
  }, [talkId]);

  useEffect(() => {
    void loadSeats();
  }, [loadSeats]);

  const seats = useMemo(
    () => seatMap ? normalizeSeats(seatMap) : [],
    [seatMap]
  );

  const occupiedCount = seats.filter(
    (seat) => seat.occupied
  ).length;

  const availableCount = seats.filter(
    (seat) => !seat.occupied && !seat.mine
  ).length;

  const hasReservation =
    seatMap?.hasReservation ??
    Boolean(seatMap?.mySeat);

  const reservationClosed =
    seatMap?.reservationClosed === true;

  async function handleReservation() {
    if (
      !selectedSeat ||
      !seatMap ||
      processing ||
      reservationClosed
    ) {
      return;
    }

    const chosen = seats.find(
      (seat) => seat.number === selectedSeat
    );

    if (!chosen || chosen.occupied || chosen.mine) {
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      const path =
        `/talks/${encodeURIComponent(talkId)}`;

      if (hasReservation) {
        await request(`${path}/seat`, {
          method: "PATCH",
          body: JSON.stringify({
            seatNumber: selectedSeat,
          }),
        });

        setMessage("Seat changed successfully.");
      } else {
        await request(path, {
          method: "POST",
          body: JSON.stringify({
            seatNumber: selectedSeat,
          }),
        });

        setMessage("Seat reserved successfully.");
      }

      await loadSeats();
      await onUpdated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save reservation."
      );

      await loadSeats();
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel() {
    if (!hasReservation || processing) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to cancel your reservation?"
      )
    ) {
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      await request(
        `/talks/${encodeURIComponent(talkId)}`,
        { method: "DELETE" }
      );

      setMessage("Reservation cancelled successfully.");

      await loadSeats();
      await onUpdated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel reservation."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="seat-picker-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
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
            <span className="eyebrow">
              SEAT RESERVATION
            </span>
            <h2>Choose Your Seat</h2>

            {seatMap?.roomName && (
              <p>{seatMap.roomName}</p>
            )}
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

        {loading && !seatMap && (
          <p>Loading seats...</p>
        )}

        {seatMap && (
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
            </div>

            <div className="seat-picker-stage">
              STAGE / SPEAKER
            </div>

            {seats.length > 0 ? (
              <div className="seat-picker-grid">
                {seats.map((seat) => {
                  const isSelected =
                    selectedSeat === seat.number;

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
                      aria-pressed={
                        isSelected || seat.mine
                      }
                      disabled={
                        seat.occupied ||
                        processing ||
                        loading ||
                        reservationClosed
                      }
                      className={[
                        "seat-picker-seat",
                        seat.occupied ? "occupied" : "",
                        seat.mine ? "mine" : "",
                        isSelected ? "selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        setSelectedSeat(seat.number)
                      }
                    >
                      <Armchair size={21} />
                      <span>{seat.number}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="page-error">
                No valid seats were returned by the server.
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
                <CheckCircle2 size={18} />
                Your current seat:
                <strong>{seatMap.mySeat}</strong>
              </p>
            )}

            {hasReservation && !seatMap.mySeat && (
              <p className="seat-picker-current">
                You have an existing reservation without
                an assigned seat. Select an available seat
                to assign one.
              </p>
            )}

            {reservationClosed && (
              <p className="page-error">
                <AlertCircle size={16} />
                Seat reservations are closed for this talk.
              </p>
            )}

            {selectedSeat && (
              <p className="seat-picker-current">
                Selected seat:
                <strong>{selectedSeat}</strong>
              </p>
            )}

            {error && (
              <p className="page-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p
                className="seat-picker-success"
                role="status"
              >
                {message}
              </p>
            )}

            <div className="seat-picker-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void loadSeats()}
                disabled={loading || processing}
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              {hasReservation && !reservationClosed && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleCancel()}
                  disabled={processing || loading}
                >
                  Cancel Reservation
                </button>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={() => void handleReservation()}
                disabled={
                  !selectedSeat ||
                  processing ||
                  loading ||
                  reservationClosed ||
                  selectedSeat === seatMap.mySeat
                }
              >
                {processing
                  ? "Saving..."
                  : hasReservation
                    ? "Change Seat"
                    : "Confirm Reservation"}
              </button>
            </div>
          </>
        )}

        {!seatMap && error && (
          <div>
            <p className="page-error" role="alert">
              {error}
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadSeats()}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
