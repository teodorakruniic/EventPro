
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  CalendarRange,
  FolderKanban,
  Plus,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <CalendarDays size={26} />
          <span>EventPro</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/conferences"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <CalendarRange size={19} />
            <span>Explore Conferences</span>
          </NavLink>

          {user?.role === "ORGANIZER" && (
            <>
              <NavLink
                to="/my-conferences"
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <FolderKanban size={19} />
                <span>My Conferences</span>
              </NavLink>

              <NavLink
                to="/conferences/new"
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Plus size={19} />
                <span>Create Conference</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
            <div>
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>{user?.role}</small>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
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
