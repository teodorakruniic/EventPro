
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  CalendarDays,
  LayoutDashboard,
  CalendarRange,
  FolderKanban,
  Plus,
  LogOut,
  Mic2,
  ClipboardList,
  Send,
  CalendarClock,
  CalendarCheck2,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getAvatarUrl } from "../services/api";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item ${isActive ? "active" : ""}`;

  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  const initials = `${user?.firstName?.charAt(0) ?? ""}${
    user?.lastName?.charAt(0) ?? ""
  }`.toUpperCase();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <CalendarDays size={26} />
          <span>EventPro</span>
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/conferences" className={navClass}>
            <CalendarRange size={19} />
            <span>Explore Conferences</span>
          </NavLink>

          {user?.role === "ORGANIZER" && (
            <>
              <NavLink
                to="/my-conferences"
                className={navClass}
              >
                <FolderKanban size={19} />
                <span>My Conferences</span>
              </NavLink>

              <NavLink
                to="/conferences/new"
                className={navClass}
              >
                <Plus size={19} />
                <span>Create Conference</span>
              </NavLink>

              <NavLink
                to="/talks/review"
                className={navClass}
              >
                <ClipboardList size={19} />
                <span>Review Talks</span>
              </NavLink>

              <NavLink
                to="/schedule"
                className={navClass}
              >
                <CalendarClock size={19} />
                <span>Conference Schedule</span>
              </NavLink>
            </>
          )}

          {user?.role === "SPEAKER" && (
            <>
              <NavLink
                to="/my-talks"
                className={navClass}
              >
                <Mic2 size={19} />
                <span>My Talks</span>
              </NavLink>

              <NavLink
                to="/talks/new"
                className={navClass}
              >
                <Send size={19} />
                <span>Submit Talk</span>
              </NavLink>
            </>
          )}

          {user?.role === "ATTENDEE" && (
            <NavLink
              to="/my-schedule"
              className={navClass}
            >
              <CalendarCheck2 size={19} />
              <span>My Schedule</span>
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={navClass}
          >
            <UserRound size={19} />
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/profile"
            className="sidebar-user"
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              className="user-avatar"
              style={{
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                initials || "EP"
              )}
            </div>

            <div>
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>
              <small>{user?.role}</small>
            </div>
          </NavLink>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
