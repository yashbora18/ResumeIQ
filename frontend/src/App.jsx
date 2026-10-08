import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import Resume from "./pages/resume/Resume";
import Analysis from "./pages/analysis/Analysis";
import JobMatching from "./pages/jobs/JobMatching";
import Analytics from "./pages/analytics/Analytics";
import Settings from "./pages/settings/Settings";

import { ToastProvider } from "./components/toast/ToastContext";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Landing */}
          <Route
            path="/"
            element={<Landing />}
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Resumes */}
          <Route
            path="/resumes"
            element={<Resume />}
          />

          {/* Resume Analysis */}
          <Route
            path="/analysis"
            element={<Analysis />}
          />

          {/* Job Matching */}
          <Route
            path="/job-matches"
            element={<JobMatching />}
          />

          {/* Backward-compatible Job Matching route */}
          <Route
            path="/job-matching"
            element={<JobMatching />}
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;