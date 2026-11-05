
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Conferences from "./pages/Conferences";
import MyConferences from "./pages/MyConferences";
import CreateConference from "./pages/CreateConference";
import ConferenceDetails from "./pages/ConferenceDetails";

import SubmitTalk from "./pages/SubmitTalk";
import MyTalks from "./pages/MyTalks";
import ReviewTalks from "./pages/ReviewTalks";

import ConferenceSchedule from "./pages/ConferenceSchedule";
import ConferenceProgram from "./pages/ConferenceProgram";
import MySchedule from "./pages/MySchedule";
import MyProfile from "./pages/MyProfile";
import OrganizerCheckIn from "./pages/OrganizerCheckIn";

import "./App.css";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return user
    ? children
    : <Navigate to="/login" replace />;
}

function OrganizerRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return user?.role === "ORGANIZER"
    ? children
    : <Navigate to="/dashboard" replace />;
}

function SpeakerRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return user?.role === "SPEAKER"
    ? children
    : <Navigate to="/dashboard" replace />;
}

function AttendeeRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return user?.role === "ATTENDEE"
    ? children
    : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          user
            ? <Navigate to="/dashboard" replace />
            : <Register />
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/profile"
          element={<MyProfile />}
        />

        <Route
          path="/conferences"
          element={<Conferences />}
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
          path="/conferences/:id"
          element={<ConferenceDetails />}
        />

        <Route
          path="/conferences/:id/program"
          element={<ConferenceProgram />}
        />

        <Route
          path="/conferences/:id/edit"
          element={
            <OrganizerRoute>
              <CreateConference />
            </OrganizerRoute>
          }
        />

        <Route
          path="/my-conferences"
          element={
            <OrganizerRoute>
              <MyConferences />
            </OrganizerRoute>
          }
        />

        <Route
          path="/my-talks"
          element={
            <SpeakerRoute>
              <MyTalks />
            </SpeakerRoute>
          }
        />

        <Route
          path="/talks/new"
          element={
            <SpeakerRoute>
              <SubmitTalk />
            </SpeakerRoute>
          }
        />

        <Route
          path="/talks/review"
          element={
            <OrganizerRoute>
              <ReviewTalks />
            </OrganizerRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <OrganizerRoute>
              <ConferenceSchedule />
            </OrganizerRoute>
          }
        />

        <Route
          path="/check-in"
          element={
            <OrganizerRoute>
              <OrganizerCheckIn />
            </OrganizerRoute>
          }
        />

        <Route
          path="/my-schedule"
          element={
            <AttendeeRoute>
              <MySchedule />
            </AttendeeRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
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
