
import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  TicketCheck,
  Keyboard,
  RotateCcw,
  Armchair,
  UserRound,
  Mic2,
} from "lucide-react";

import { API_URL } from "../services/api";
import "./OrganizerCheckIn.css";

interface CheckInResult {
  message: string;
  reservationId: string;
  attendee: {
    firstName: string;
    lastName: string;
  };
  talk: string;
  seatNumber: string | null;
  checkedIn: boolean;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function submitCheckIn(
  ticketToken: string
): Promise<CheckInResult> {
  const authToken = sessionStorage.getItem("eventpro_token");

  const response = await fetch(
    `${API_URL}/api/reservations/check-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}),
      },
      body: JSON.stringify({ ticketToken }),
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
        : "Ticket verification failed.";

    throw new Error(message);
  }

  return data as CheckInResult;
}

export default function OrganizerCheckIn() {
  const [ticketToken, setTicketToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const scanHandledRef = useRef(false);

  const handleCheckIn = useCallback(async (rawToken: string) => {
    const token = rawToken.trim();

    if (processingRef.current) return;

    setError("");
    setResult(null);

    if (!UUID_PATTERN.test(token)) {
      setError("Please enter a valid QR ticket token.");
      return;
    }

    processingRef.current = true;
    setProcessing(true);

    try {
      const data = await submitCheckIn(token);
      setResult(data);
      setTicketToken("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the ticket."
      );
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    scanHandledRef.current = false;

    async function startScanner() {
      try {
        const instance = new Html5Qrcode(
          "organizer-qr-reader",
          { verbose: false }
        );

        scanner = instance;
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
          },
          (decodedText) => {
            if (cancelled || scanHandledRef.current) return;

            scanHandledRef.current = true;
            setScanning(false);
            void handleCheckIn(decodedText);
          },
          () => {
            // Ignore individual frames without a QR code.
          }
        );

        if (cancelled) {
            if (instance.isScanning) {
              await instance.stop().catch(() => undefined);
            }
          
            instance.clear();
          }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Unable to start camera: ${err.message}`
              : "Unable to access the camera."
          );
          setScanning(false);
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;

      const instance = scanner;

      if (instance) {
        void (async () => {
          try {
            if (instance.isScanning) {
              await instance.stop();
            }
            await instance.clear();
          } catch {
            // The scanner may already have stopped.
          }

          if (scannerRef.current === instance) {
            scannerRef.current = null;
          }
        })();
      }
    };
  }, [scanning, handleCheckIn]);

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (scanning || processing) return;

    void handleCheckIn(ticketToken);
  }

  function resetCheckIn() {
    setError("");
    setResult(null);
    setTicketToken("");
    scanHandledRef.current = false;
  }

  return (
    <div className="workspace-page organizer-checkin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORGANIZER PORTAL</span>
          <h1>Ticket Check-in</h1>
          <p>
            Scan attendee QR tickets and securely confirm
            admission to your conference sessions.
          </p>
        </div>
      </div>

      <div className="checkin-layout">
        <section className="checkin-panel">
          <div className="checkin-panel-heading">
            <div className="checkin-panel-icon">
              <ScanLine size={23} />
            </div>
            <div>
              <h2>QR Code Scanner</h2>
              <p>Use your device camera to scan a ticket.</p>
            </div>
          </div>

          {scanning ? (
            <>
              <div
                id="organizer-qr-reader"
                className="checkin-camera"
              />

              <button
                type="button"
                className="checkin-secondary-button"
                onClick={() => setScanning(false)}
              >
                <CameraOff size={18} />
                Stop Camera
              </button>
            </>
          ) : (
            <div className="checkin-scanner-placeholder">
              <div className="checkin-scan-symbol">
                <ScanLine size={54} strokeWidth={1.5} />
              </div>

              <h3>Ready to scan</h3>
              <p>
                Position the QR code inside the camera frame.
              </p>

              <button
                type="button"
                className="checkin-primary-button"
                onClick={() => {
                  resetCheckIn();
                  setScanning(true);
                }}
                disabled={processing}
              >
                <Camera size={18} />
                Start Camera
              </button>
            </div>
          )}

          <div className="checkin-divider">
            <span>OR ENTER MANUALLY</span>
          </div>

          <form
            className="checkin-manual-form"
            onSubmit={handleManualSubmit}
          >
            <label htmlFor="checkin-token">
              Ticket Token
            </label>

            <div className="checkin-input-wrapper">
              <Keyboard size={19} />
              <input
                id="checkin-token"
                type="text"
                value={ticketToken}
                onChange={(event) =>
                  setTicketToken(event.target.value)
                }
                placeholder="Enter ticket UUID"
                autoComplete="off"
                spellCheck={false}
                disabled={processing || scanning}
              />
            </div>

            <button
              type="submit"
              className="checkin-primary-button"
              disabled={
                processing ||
                scanning ||
                !ticketToken.trim()
              }
            >
              <TicketCheck size={18} />
              {processing ? "Verifying..." : "Verify & Check In"}
            </button>
          </form>
        </section>

        <section className="checkin-panel checkin-result-panel">
          <div className="checkin-panel-heading">
            <div className="checkin-panel-icon">
              <TicketCheck size={23} />
            </div>

            <div>
              <h2>Verification Result</h2>
              <p>Admission details will appear here.</p>
            </div>
          </div>

          {processing && (
            <div className="checkin-feedback">
              <ScanLine size={32} />
              <h3>Verifying ticket...</h3>
              <p>Please wait while we confirm the reservation.</p>
            </div>
          )}

          {!processing && error && (
            <div className="checkin-feedback checkin-feedback-error" role="alert">
              <AlertCircle size={42} />
              <h3>Check-in Failed</h3>
              <p>{error}</p>

              <button
                type="button"
                className="checkin-secondary-button"
                onClick={resetCheckIn}
              >
                <RotateCcw size={17} />
                Try Again
              </button>
            </div>
          )}

          {!processing && result && (
            <div
              className="checkin-feedback checkin-feedback-success"
              role="status"
            >
              <CheckCircle2 size={48} />

              <h3>Check-in Successful!</h3>
              <p>The attendee has been admitted successfully.</p>

              <div className="checkin-ticket-details">
                <div>
                  <UserRound size={19} />
                  <span>
                    <small>ATTENDEE</small>
                    <strong>
                      {result.attendee.firstName}{" "}
                      {result.attendee.lastName}
                    </strong>
                  </span>
                </div>

                <div>
                  <Mic2 size={19} />
                  <span>
                    <small>SESSION</small>
                    <strong>{result.talk}</strong>
                  </span>
                </div>

                <div>
                  <Armchair size={19} />
                  <span>
                    <small>SEAT</small>
                    <strong>
                      {result.seatNumber ?? "Not assigned"}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="checkin-primary-button"
                onClick={resetCheckIn}
              >
                <ScanLine size={18} />
                Check In Next Attendee
              </button>
            </div>
          )}

          {!processing && !error && !result && (
            <div className="checkin-feedback checkin-feedback-idle">
              <ScanLine size={44} strokeWidth={1.5} />
              <h3>Waiting for ticket</h3>
              <p>
                Scan a QR code or enter a ticket token
                to begin verification.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
