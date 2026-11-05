
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  DoorOpen,
  MapPin,
  Ticket,
  X,
} from "lucide-react";

import { API_URL } from "../services/api";
import "./TicketModal.css";

interface TicketData {
  id: string;
  ticketToken: string;
  attendee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  seatNumber: string | null;
  checkedInAt: string | null;
  talk: {
    id: string;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    room: { name: string } | null;
  };
  conference: {
    id: string;
    title: string;
    location: string;
    status: string;
  };
}

interface TicketModalProps {
  reservationId: string;
  onClose: () => void;
}

function formatDate(value: string) {
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

export default function TicketModal({
  reservationId,
  onClose,
}: TicketModalProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTicket() {
      setLoading(true);
      setError("");
      setTicket(null);
      setCopyMessage("");

      try {
        const token = sessionStorage.getItem("eventpro_token");

        const response = await fetch(
          `${API_URL}/api/reservations/tickets/${encodeURIComponent(reservationId)}`,
          {
            signal: controller.signal,
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );

        const responseText = await response.text();

        let data: unknown;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Invalid server response (HTTP ${response.status}).`
          );
        }

        if (!response.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof data.message === "string"
              ? data.message
              : "Unable to load your ticket.";

          throw new Error(message);
        }

        setTicket(data as TicketData);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your ticket."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTicket();

    return () => controller.abort();
  }, [reservationId]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  async function handleCopyToken() {
    if (!ticket) return;

    setCopyMessage("");

    try {
      await navigator.clipboard.writeText(ticket.ticketToken);
      setCopyMessage("Token copied successfully!");
    } catch {
      setCopyMessage("Unable to copy token. Please copy it manually.");
    }
  }

  return (
    <div
      className="ticket-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Digital ticket"
      >
        <button
          type="button"
          className="ticket-close"
          onClick={onClose}
          aria-label="Close ticket"
        >
          <X size={20} />
        </button>

        {loading && (
          <p className="ticket-message">
            Loading ticket...
          </p>
        )}

        {error && (
          <p className="ticket-error" role="alert">
            {error}
          </p>
        )}

        {ticket && (
          <>
            <div className="ticket-header">
              <div className="ticket-brand">
                <Ticket size={21} />
                EVENTPRO
              </div>

              <span className="ticket-label">
                DIGITAL ADMISSION TICKET
              </span>

              <h2>{ticket.conference.title}</h2>
              <p>{ticket.talk.title}</p>
            </div>

            <div className="ticket-content">
              <div className="ticket-attendee">
                <span>ATTENDEE</span>

                <strong>
                  {ticket.attendee.firstName}{" "}
                  {ticket.attendee.lastName}
                </strong>

                <small>{ticket.attendee.email}</small>
              </div>

              <div className="ticket-details">
                <div>
                  <CalendarDays size={18} />
                  <span>
                    <small>DATE</small>
                    <strong>
                      {ticket.talk.startsAt
                        ? formatDate(ticket.talk.startsAt)
                        : "TBA"}
                    </strong>
                  </span>
                </div>

                <div>
                  <Clock3 size={18} />
                  <span>
                    <small>TIME</small>
                    <strong>
                      {ticket.talk.startsAt
                        ? formatTime(ticket.talk.startsAt)
                        : "TBA"}
                      {ticket.talk.endsAt
                        ? ` – ${formatTime(ticket.talk.endsAt)}`
                        : ""}
                    </strong>
                  </span>
                </div>

                <div>
                  <DoorOpen size={18} />
                  <span>
                    <small>ROOM</small>
                    <strong>
                      {ticket.talk.room?.name ?? "TBA"}
                    </strong>
                  </span>
                </div>

                <div>
                  <Armchair size={18} />
                  <span>
                    <small>SEAT</small>
                    <strong>
                      {ticket.seatNumber ?? "Not assigned"}
                    </strong>
                  </span>
                </div>

                <div className="ticket-location">
                  <MapPin size={18} />
                  <span>
                    <small>LOCATION</small>
                    <strong>
                      {ticket.conference.location}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="ticket-qr-section">
                <div className="ticket-qr-code">
                  <QRCodeSVG
                    value={ticket.ticketToken}
                    size={174}
                    level="H"
                    marginSize={2}
                    title="Reservation QR code"
                  />
                </div>

                <span>SCAN AT THE ENTRANCE</span>

                <p>
                  Present this QR code to the conference organizer.
                </p>

                <div className="ticket-token-section">
                  <span>YOUR TICKET TOKEN</span>

                  <code>{ticket.ticketToken}</code>

                  <button
                    type="button"
                    onClick={() => void handleCopyToken()}
                  >
                    <Copy size={15} />
                    Copy Token
                  </button>

                  {copyMessage && (
                    <small
                      className="ticket-copy-message"
                      role="status"
                    >
                      {copyMessage}
                    </small>
                  )}
                </div>
              </div>

              <div className="ticket-footer">
                {ticket.checkedInAt ? (
                  <span className="ticket-checked-in">
                    <CheckCircle2 size={17} />
                    Checked in successfully
                  </span>
                ) : (
                  <span className="ticket-valid">
                    <CheckCircle2 size={17} />
                    Ticket issued
                  </span>
                )}

                <small>
                  Ticket ID:{" "}
                  {ticket.id.slice(0, 8).toUpperCase()}
                </small>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
