
import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
  } from "react";
  
  import {
    Camera,
    CheckCircle2,
    LockKeyhole,
    Mail,
    Save,
    ShieldCheck,
    Trash2,
    UserRound,
  } from "lucide-react";
  
  import { useAuth } from "../context/AuthContext";
  
  import {
    apiRequest,
    getAvatarUrl,
    type User,
  } from "../services/api";
  
  import "./MyProfile.css";
  
  interface ProfileResponse {
    message: string;
    user: User;
  }
  
  interface Message {
    type: "success" | "error";
    text: string;
  }
  
  export default function MyProfile() {
    const { user, updateUser } = useAuth();
  
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [changingPassword, setChangingPassword] =
      useState(false);
  
    const [message, setMessage] = useState<Message | null>(
      null
    );
  
    const [firstName, setFirstName] = useState(
      user?.firstName ?? ""
    );
    const [lastName, setLastName] = useState(
      user?.lastName ?? ""
    );
    const [email, setEmail] = useState(
      user?.email ?? ""
    );
    const [bio, setBio] = useState(user?.bio ?? "");
  
    const [currentPassword, setCurrentPassword] =
      useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
      useState("");
  
    useEffect(() => {
      let active = true;
  
      async function loadProfile() {
        try {
          const profile = await apiRequest<User>(
            "/api/profile/me"
          );
  
          if (!active) return;
  
          updateUser(profile);
          setFirstName(profile.firstName);
          setLastName(profile.lastName);
          setEmail(profile.email);
          setBio(profile.bio ?? "");
        } catch (error) {
          if (!active) return;
  
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Unable to load profile.",
          });
        } finally {
          if (active) setLoading(false);
        }
      }
  
      void loadProfile();
  
      return () => {
        active = false;
      };
      // Load the profile when the page is opened.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    function showError(error: unknown) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    }
  
    async function handleSaveProfile(
      event: FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();
      setSaving(true);
      setMessage(null);
  
      try {
        const result = await apiRequest<ProfileResponse>(
          "/api/profile/me",
          {
            method: "PATCH",
            body: JSON.stringify({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              bio: bio.trim() || null,
            }),
          }
        );
  
        updateUser(result.user);
  
        setMessage({
          type: "success",
          text: result.message,
        });
      } catch (error) {
        showError(error);
      } finally {
        setSaving(false);
      }
    }
  
    async function handleAvatarUpload(
      event: ChangeEvent<HTMLInputElement>
    ) {
      const file = event.target.files?.[0];
  
      if (!file) return;
  
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
  
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          type: "error",
          text: "Please select a JPG, PNG or WebP image.",
        });
        event.target.value = "";
        return;
      }
  
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "Image size must not exceed 5 MB.",
        });
        event.target.value = "";
        return;
      }
  
      const formData = new FormData();
      formData.append("avatar", file);
  
      setUploading(true);
      setMessage(null);
  
      try {
        const result = await apiRequest<ProfileResponse>(
          "/api/profile/avatar",
          {
            method: "POST",
            body: formData,
          }
        );
  
        updateUser(result.user);
  
        setMessage({
          type: "success",
          text: result.message,
        });
      } catch (error) {
        showError(error);
      } finally {
        setUploading(false);
        event.target.value = "";
      }
    }
  
    async function handleRemoveAvatar() {
      setUploading(true);
      setMessage(null);
  
      try {
        const result = await apiRequest<ProfileResponse>(
          "/api/profile/avatar",
          {
            method: "DELETE",
          }
        );
  
        updateUser(result.user);
  
        setMessage({
          type: "success",
          text: result.message,
        });
      } catch (error) {
        showError(error);
      } finally {
        setUploading(false);
      }
    }
  
    async function handleChangePassword(
      event: FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();
      setMessage(null);
  
      if (newPassword !== confirmPassword) {
        setMessage({
          type: "error",
          text: "New passwords do not match.",
        });
        return;
      }
  
      if (newPassword.length < 8) {
        setMessage({
          type: "error",
          text: "Password must contain at least 8 characters.",
        });
        return;
      }
  
      setChangingPassword(true);
  
      try {
        const result = await apiRequest<{
          message: string;
        }>("/api/profile/password", {
          method: "PATCH",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });
  
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
  
        setMessage({
          type: "success",
          text: result.message,
        });
      } catch (error) {
        showError(error);
      } finally {
        setChangingPassword(false);
      }
    }
  
    const avatarUrl = getAvatarUrl(user?.avatarUrl);
  
    const initials = `${user?.firstName?.charAt(0) ?? ""}${
      user?.lastName?.charAt(0) ?? ""
    }`.toUpperCase();
  
    if (loading) {
      return (
        <div className="profile-loading">
          Loading your profile...
        </div>
      );
    }
  
    return (
      <div className="profile-page">
        <header className="profile-page-header">
          <div>
            <div className="profile-eyebrow">
              ACCOUNT SETTINGS
            </div>
            <h1>My Profile</h1>
            <p>
              Manage your personal information, profile
              picture and account security.
            </p>
          </div>
        </header>
  
        {message && (
          <div
            className={`profile-alert ${message.type}`}
            role="alert"
          >
            {message.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <ShieldCheck size={19} />
            )}
            <span>{message.text}</span>
          </div>
        )}
  
        <section className="profile-card profile-identity">
          <div className="profile-large-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
              />
            ) : (
              <span>{initials || "EP"}</span>
            )}
          </div>
  
          <div className="profile-identity-details">
            <h2>
              {user?.firstName} {user?.lastName}
            </h2>
            <p>{user?.email}</p>
            <span className="profile-role">
              {user?.role}
            </span>
          </div>
  
          <div className="profile-avatar-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              hidden
            />
  
            <button
              type="button"
              className="profile-primary-button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={17} />
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
  
            {user?.avatarUrl && (
              <button
                type="button"
                className="profile-outline-button"
                disabled={uploading}
                onClick={() => void handleRemoveAvatar()}
              >
                <Trash2 size={17} />
                Remove
              </button>
            )}
          </div>
        </section>
  
        <div className="profile-content-grid">
          <section className="profile-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <UserRound size={20} />
              </div>
              <div>
                <h2>Personal Information</h2>
                <p>Update your account details.</p>
              </div>
            </div>
  
            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-row">
                <label className="profile-field">
                  <span>First Name</span>
                  <input
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
  
                <label className="profile-field">
                  <span>Last Name</span>
                  <input
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
              </div>
  
              <label className="profile-field">
                <span>Email Address</span>
                <div className="profile-input-icon">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>
              </label>
  
              <label className="profile-field">
                <span>Biography</span>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a little about yourself..."
                />
                <small>{bio.length}/2000 characters</small>
              </label>
  
              <button
                type="submit"
                className="profile-primary-button"
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
  
          <section className="profile-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h2>Account Security</h2>
                <p>Change your account password.</p>
              </div>
            </div>
  
            <form onSubmit={handleChangePassword}>
              <label className="profile-field">
                <span>Current Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  required
                />
              </label>
  
              <label className="profile-field">
                <span>New Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
  
              <label className="profile-field">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
  
              <button
                type="submit"
                className="profile-primary-button"
                disabled={changingPassword}
              >
                <LockKeyhole size={17} />
                {changingPassword
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </form>
  
            <div className="profile-security-note">
              <ShieldCheck size={18} />
              <span>
                Use a unique password with at least
                8 characters.
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  }
  