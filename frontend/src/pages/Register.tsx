
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ArrowRight,
  Users,
  Mic2,
  CalendarRange,
  CheckCircle2,
} from "lucide-react";
import { authRequest, type UserRole } from "../services/api";
import { useAuth } from "../context/AuthContext";

const roles = [
  {
    value: "ATTENDEE",
    title: "Attendee",
    description: "Discover events and reserve your seat.",
    icon: Users,
  },
  {
    value: "SPEAKER",
    title: "Speaker",
    description: "Share your knowledge and present talks.",
    icon: Mic2,
  },
  {
    value: "ORGANIZER",
    title: "Organizer",
    description: "Create and manage professional events.",
    icon: CalendarRange,
  },
] as const;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "ATTENDEE" as UserRole,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authRequest("register", form);
      login(result);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand">
          <CalendarDays size={28} />
          <span>EventPro</span>
        </div>

        <div className="auth-content register-content">
          <h1>Create your account</h1>
          <p>Join EventPro and start your experience.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div>
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <label htmlFor="registerEmail">Email address</label>
            <input
              id="registerEmail"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />

            <label htmlFor="registerPassword">Password</label>
            <input
              id="registerPassword"
              type="password"
              placeholder="Minimum 8 characters"
              minLength={8}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />

            <div className="role-section">
              <label>Choose your account type</label>
              <p>How would you like to use EventPro?</p>

              <div className="role-options">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = form.role === role.value;

                  return (
                    <label
                      key={role.value}
                      className={`role-option ${selected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selected}
                        onChange={() =>
                          setForm({ ...form, role: role.value })
                        }
                      />

                      <div className="role-icon">
                        <Icon size={20} />
                      </div>

                      <div className="role-details">
                        <strong>{role.title}</strong>
                        <span>{role.description}</span>
                      </div>

                      {selected && (
                        <CheckCircle2
                          size={19}
                          className="role-check"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-visual">
        <div className="visual-content">
          <div className="visual-icon">
            <CalendarDays size={32} />
          </div>
          <h2>Bring your events to life.</h2>
          <p>
            One platform for planning, organizing, and
            experiencing conferences.
          </p>
        </div>
      </div>
    </div>
  );
}
