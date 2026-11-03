import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, ImagePlus, MapPin, Users, X } from "lucide-react";
import {
  createConference,
  getMyConferences,
  updateConference,
  uploadConferenceImage,
  deleteConferenceImage,
  conferenceImageUrl,
  type ConferenceInput,
} from "../services/conferences";
import "./CreateConference.css";

function toLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getError(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save conference.";
}

export default function CreateConference() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError("");
    getMyConferences().then((conferences) => {
      if (!active) return;
      const conference = conferences.find((item) => item.id === id);
      if (!conference) throw new Error("Conference not found.");
      if (conference.status !== "DRAFT") throw new Error("Only draft conferences can be edited.");
      setTitle(conference.title);
      setDescription(conference.description ?? "");
      setLocation(conference.location);
      setCapacity(String(conference.capacity));
      setStartsAt(toLocalInput(conference.startsAt));
      setEndsAt(toLocalInput(conference.endsAt));
      setExistingImage(conference.imageUrl ?? null);
    }).catch((err: unknown) => { if (active) setError(getError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!selectedImage) { setPreview(null); return; }
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The image must not exceed 5 MB.");
      return;
    }
    setError("");
    setSelectedImage(file);
    setRemoveExistingImage(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setNotice("");
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();
    const parsedCapacity = Number(capacity);
    if (cleanTitle.length < 3 || cleanTitle.length > 150) { setError("Conference title must contain 3–150 characters."); return; }
    if (cleanDescription.length > 5000) { setError("Description must not exceed 5000 characters."); return; }
    if (cleanLocation.length < 2 || cleanLocation.length > 200) { setError("Location must contain 2–200 characters."); return; }
    if (!Number.isSafeInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 100000) { setError("Capacity must be between 1 and 100000."); return; }
    if (!startsAt || !endsAt) { setError("Please select both start and end dates."); return; }
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) { setError("Please enter valid conference dates."); return; }
    if (endDate <= startDate) { setError("End date must be after start date."); return; }
    const data: ConferenceInput = {
      title: cleanTitle, description: cleanDescription, location: cleanLocation,
      capacity: parsedCapacity, startsAt: startDate.toISOString(), endsAt: endDate.toISOString(),
    };
    setSaving(true);
    let savedId: string | null = null;
    try {
      if (id) {
        await updateConference(id, data);
        savedId = id;
      } else {
        const created = await createConference(data);
        savedId = created.id;
      }
      if (selectedImage) {
        await uploadConferenceImage(savedId, selectedImage);
      } else if (removeExistingImage && existingImage) {
        await deleteConferenceImage(savedId);
      }
      navigate("/my-conferences");
    } catch (err) {
      const detail = getError(err);
      if (savedId) {
        setNotice("Conference details were saved, but the image operation did not finish.");
        setError(detail);
      } else {
        setError(detail);
      }
    } finally {
      setSaving(false);
    }
  }

  const displayedImage = preview ?? (!removeExistingImage ? conferenceImageUrl(existingImage) : null);

  return (
    <div className="workspace-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVENT MANAGEMENT</span>
          <h1>{editing ? "Edit Conference" : "Create Conference"}</h1>
          <p>{editing ? "Update your draft conference and cover image." : "Set up a new conference and give it a memorable cover image."}</p>
        </div>
      </div>
      {loading ? <p>Loading conference...</p> : (
        <form className="conference-form conference-editor" onSubmit={(event) => void handleSubmit(event)}>
          <div className="conference-editor-intro">
            <h2>Conference details</h2>
            <p>Provide the information attendees will see when your conference is published.</p>
          </div>
          {error && <p className="page-error" role="alert">{error}</p>}
          {notice && <p className="conference-editor-notice" role="status">{notice}</p>}
          <div className="conference-editor-image-section">
            <div className="conference-editor-section-title"><ImagePlus size={20} /><div><h3>Cover image</h3><p>JPG, PNG or WebP · Maximum 5 MB</p></div></div>
            <div className="conference-editor-image-preview">
              {displayedImage ? <img src={displayedImage} alt="Conference cover preview" /> : <div className="conference-editor-image-empty"><ImagePlus size={38} /><span>No cover image selected</span></div>}
            </div>
            <div className="conference-editor-image-actions">
              <label className="secondary-button conference-editor-upload">
                <ImagePlus size={17} /> {displayedImage ? "Change image" : "Choose image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={handleImageChange} hidden />
              </label>
              {displayedImage && <button className="secondary-button" type="button" disabled={saving} onClick={() => { setSelectedImage(null); setRemoveExistingImage(true); }}><X size={17} /> Remove image</button>}
            </div>
          </div>
          <div className="field"><label htmlFor="conference-title">Conference title</label><input id="conference-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. European Technology Summit" minLength={3} maxLength={150} required disabled={saving} /></div>
          <div className="field"><label htmlFor="conference-description">Description</label><textarea id="conference-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the conference, its topics and target audience..." rows={5} maxLength={5000} disabled={saving} /></div>
          <div className="form-two-columns">
            <div className="field"><label htmlFor="conference-location"><MapPin size={15} /> Location</label><input id="conference-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Maribor, Slovenia" minLength={2} maxLength={200} required disabled={saving} /></div>
            <div className="field"><label htmlFor="conference-capacity"><Users size={15} /> Maximum attendees</label><input id="conference-capacity" type="number" min={1} max={100000} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required disabled={saving} /></div>
          </div>
          <div className="form-two-columns">
            <div className="field"><label htmlFor="conference-start"><CalendarDays size={15} /> Start date and time</label><input id="conference-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required disabled={saving} /></div>
            <div className="field"><label htmlFor="conference-end"><CalendarDays size={15} /> End date and time</label><input id="conference-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} min={startsAt || undefined} required disabled={saving} /></div>
          </div>
          <div className="form-actions"><Link className="secondary-button" to="/my-conferences">Cancel</Link><button className="action-button" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create draft"}</button></div>
        </form>
      )}
    </div>
  );
}
