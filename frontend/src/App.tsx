
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Conferences from "./pages/Conferences";
import MyConferences from "./pages/MyConferences";
import CreateConference from "./pages/CreateConference";
import "./App.css";
import ConferenceDetails from "./pages/ConferenceDetails";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function OrganizerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === "ORGANIZER"
    ? children
    : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />


      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conferences" element={<Conferences />} />

        <Route
          path="/my-conferences"
          element={
            <OrganizerRoute>
              <MyConferences />
            </OrganizerRoute>
          }
        />

        <Route
          path="/conferences/new"
          element={
            <OrganizerRoute>
              <CreateConference />
            </OrganizerRoute>
          }
        />

        <Route
          path="/conferences/:id/edit"
          element={
            <OrganizerRoute>
              <CreateConference />
            </OrganizerRoute>
          }
        />
      </Route>
      <Route
  path="/conferences/:id"
  element={<ConferenceDetails />}
/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
