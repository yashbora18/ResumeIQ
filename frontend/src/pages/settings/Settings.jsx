import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

import DashboardLayout from "../dashboard/DashboardLayout";
import { logoutUser } from "../../services/authService";
import "./Settings.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "resumeiq-access-token";
const THEME_KEY = "resumeiq-theme";
const NOTIFICATION_KEY =
  "resumeiq-settings-notifications";

const DEFAULT_NOTIFICATIONS = {
  email: true,
  browser: true,
};

function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    throw new Error(
      data?.detail ||
        "Unable to load your account information."
    );
  }

  return data;
}

function getInitialTheme() {
  return (
    document.documentElement.getAttribute(
      "data-theme"
    ) ||
    localStorage.getItem(THEME_KEY) ||
    "dark"
  );
}

function getInitialNotifications() {
  try {
    const saved =
      localStorage.getItem(
        NOTIFICATION_KEY
      );

    if (!saved) {
      return DEFAULT_NOTIFICATIONS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_NOTIFICATIONS,
      ...parsed,
    };
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

function getDisplayName(user) {
  return (
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "ResumeIQ User"
  );
}

function getInitials(name) {
  const parts = String(
    name || "ResumeIQ User"
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function getRoleLabel(user) {
  if (!user?.role) {
    return "Member";
  }

  return String(user.role)
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}

function Settings() {
  const [user, setUser] = useState(null);

  const [theme, setTheme] =
    useState(getInitialTheme);

  const [notifications, setNotifications] =
    useState(getInitialNotifications);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [toast, setToast] =
    useState(null);

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  const roleLabel = useMemo(
    () => getRoleLabel(user),
    [user]
  );

  async function loadSettings() {
    try {
      setError("");

      if (!user) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const currentUser =
        await getCurrentUser();

      setUser(currentUser);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    document.documentElement.setAttribute(
      "data-resumeiq-theme",
      theme
    );

    localStorage.setItem(
      THEME_KEY,
      theme
    );

    window.dispatchEvent(
      new CustomEvent(
        "resumeiq-theme-change",
        {
          detail: theme,
        }
      )
    );
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () =>
      window.clearTimeout(timer);
  }, [toast]);

  function showToast(type, message) {
    setToast({
      type,
      message,
    });
  }

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);

    showToast(
      "success",
      `${
        nextTheme === "dark"
          ? "Dark"
          : "Light"
      } theme enabled.`
    );
  }

  function handleNotificationChange(key) {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));

    showToast(
      "success",
      "Notification preference saved."
    );
  }

  /*
   * IMPORTANT:
   * Do NOT remove the token here.
   *
   * DashboardLayout owns the logout confirmation
   * modal. We send a request to it instead.
   */
  function handleSignOut() {
  try {
    logoutUser();

    window.location.replace("/login");
  } catch (error) {
    console.error("Logout failed:", error);

    localStorage.removeItem("resumeiq-access-token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");

    window.location.replace("/login");
  }
}

  if (loading) {
    return (
      <DashboardLayout>
        <main className="settings-page settings-page--state">
          <section className="settings-state-card">
            <div className="settings-state-icon settings-state-icon--loading">
              <RefreshCw
                size={22}
                className="settings-spin"
              />
            </div>

            <span className="settings-eyebrow">
              ACCOUNT SETTINGS
            </span>

            <h1>
              Loading your settings
            </h1>

            <p>
              ResumeIQ is securely
              loading your account
              information.
            </p>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  if (error && !user) {
    return (
      <DashboardLayout>
        <main className="settings-page settings-page--state">
          <section className="settings-state-card settings-state-card--error">
            <div className="settings-state-icon">
              <ShieldCheck size={22} />
            </div>

            <span className="settings-eyebrow">
              ACCOUNT SETTINGS
            </span>

            <h1>
              We couldn't load Settings
            </h1>

            <p>{error}</p>

            <button
              type="button"
              className="settings-primary-button"
              onClick={loadSettings}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="settings-page">
        <section className="settings-header">
          <div>
            <span className="settings-eyebrow">
              ACCOUNT SETTINGS
            </span>

            <h1>Settings</h1>

            <p>
              Manage your profile,
              appearance,
              notifications, and
              account security
              preferences.
            </p>
          </div>

          <button
            type="button"
            className="settings-refresh-button"
            onClick={loadSettings}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "settings-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </section>

        {error && (
          <div className="settings-inline-error">
            <ShieldCheck size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="settings-profile-banner">
          <div className="settings-profile-avatar">
            {initials}
          </div>

          <div className="settings-profile-main">
            <span className="settings-profile-label">
              SIGNED IN ACCOUNT
            </span>

            <h2>{displayName}</h2>

            <p>
              {user?.email ||
                "Email unavailable"}
            </p>
          </div>

          <div className="settings-profile-meta">
            <span className="settings-role-badge">
              <UserRound size={14} />
              {roleLabel}
            </span>

            <span className="settings-profile-status">
              <span className="settings-status-dot" />
              Active session
            </span>
          </div>
        </section>

        <section className="settings-grid">
          <div className="settings-column">
            <article className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon settings-card-icon--teal">
                  <CircleUserRound size={19} />
                </div>

                <div>
                  <span className="settings-card-eyebrow">
                    PROFILE
                  </span>

                  <h2>
                    Profile information
                  </h2>

                  <p>
                    Your account
                    information from
                    ResumeIQ.
                  </p>
                </div>
              </div>

              <div className="settings-profile-fields">
                <div className="settings-field">
                  <span className="settings-field-label">
                    Full name
                  </span>

                  <div className="settings-readonly-field">
                    <UserRound size={16} />
                    <span>
                      {displayName}
                    </span>
                  </div>
                </div>

                <div className="settings-field">
                  <span className="settings-field-label">
                    Email address
                  </span>

                  <div className="settings-readonly-field">
                    <Mail size={16} />
                    <span>
                      {user?.email ||
                        "Not available"}
                    </span>
                  </div>
                </div>

                <div className="settings-field">
                  <span className="settings-field-label">
                    Account role
                  </span>

                  <div className="settings-readonly-field">
                    <ShieldCheck size={16} />
                    <span>
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="settings-card-note">
                <Check size={16} />
                Profile information is
                securely loaded from your
                authenticated ResumeIQ
                account.
              </div>
            </article>

            <article className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon settings-card-icon--blue">
                  <Bell size={19} />
                </div>

                <div>
                  <span className="settings-card-eyebrow">
                    NOTIFICATIONS
                  </span>

                  <h2>
                    Notification preferences
                  </h2>

                  <p>
                    Choose how ResumeIQ
                    should notify you.
                  </p>
                </div>
              </div>

              <div className="settings-options">
                <button
                  type="button"
                  className="settings-option"
                  onClick={() =>
                    handleNotificationChange(
                      "email"
                    )
                  }
                  aria-pressed={
                    notifications.email
                  }
                >
                  <div className="settings-option-icon">
                    <Mail size={17} />
                  </div>

                  <div className="settings-option-copy">
                    <strong>
                      Email notifications
                    </strong>

                    <span>
                      Receive important
                      account and resume
                      updates.
                    </span>
                  </div>

                  <span
                    className={`settings-toggle ${
                      notifications.email
                        ? "settings-toggle--on"
                        : ""
                    }`}
                  >
                    <span />
                  </span>
                </button>

                <button
                  type="button"
                  className="settings-option"
                  onClick={() =>
                    handleNotificationChange(
                      "browser"
                    )
                  }
                  aria-pressed={
                    notifications.browser
                  }
                >
                  <div className="settings-option-icon">
                    <Bell size={17} />
                  </div>

                  <div className="settings-option-copy">
                    <strong>
                      Browser notifications
                    </strong>

                    <span>
                      Show helpful alerts
                      while you use
                      ResumeIQ.
                    </span>
                  </div>

                  <span
                    className={`settings-toggle ${
                      notifications.browser
                        ? "settings-toggle--on"
                        : ""
                    }`}
                  >
                    <span />
                  </span>
                </button>
              </div>
            </article>
          </div>

          <div className="settings-column">
            <article className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon settings-card-icon--green">
                  {theme === "dark" ? (
                    <Moon size={19} />
                  ) : (
                    <Sun size={19} />
                  )}
                </div>

                <div>
                  <span className="settings-card-eyebrow">
                    APPEARANCE
                  </span>

                  <h2>
                    Theme preference
                  </h2>

                  <p>
                    Choose the interface
                    appearance for your
                    ResumeIQ workspace.
                  </p>
                </div>
              </div>

              <div className="settings-theme-grid">
                <button
                  type="button"
                  className={`settings-theme-option ${
                    theme === "dark"
                      ? "settings-theme-option--active"
                      : ""
                  }`}
                  onClick={() =>
                    handleThemeChange(
                      "dark"
                    )
                  }
                  aria-pressed={
                    theme === "dark"
                  }
                >
                  <span className="settings-theme-icon">
                    <Moon size={18} />
                  </span>

                  <span>
                    <strong>Dark</strong>
                    <small>
                      Focused and low-glare
                    </small>
                  </span>

                  {theme === "dark" && (
                    <Check size={17} />
                  )}
                </button>

                <button
                  type="button"
                  className={`settings-theme-option ${
                    theme === "light"
                      ? "settings-theme-option--active"
                      : ""
                  }`}
                  onClick={() =>
                    handleThemeChange(
                      "light"
                    )
                  }
                  aria-pressed={
                    theme === "light"
                  }
                >
                  <span className="settings-theme-icon">
                    <Sun size={18} />
                  </span>

                  <span>
                    <strong>Light</strong>
                    <small>
                      Bright and clean
                    </small>
                  </span>

                  {theme === "light" && (
                    <Check size={17} />
                  )}
                </button>
              </div>
            </article>

            <article className="settings-card settings-card--security">
              <div className="settings-card-header">
                <div className="settings-card-icon settings-card-icon--amber">
                  <LockKeyhole size={19} />
                </div>

                <div>
                  <span className="settings-card-eyebrow">
                    SECURITY
                  </span>

                  <h2>
                    Account security
                  </h2>

                  <p>
                    Keep your ResumeIQ
                    session protected.
                  </p>
                </div>
              </div>

              <div className="settings-security-item">
                <div className="settings-security-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <strong>
                    Authenticated session
                  </strong>

                  <span>
                    Your dashboard requests
                    use your current secure
                    access token.
                  </span>
                </div>

                <span className="settings-secure-badge">
                  Secure
                </span>
              </div>

              <div className="settings-security-item">
                <div className="settings-security-icon">
                  <LockKeyhole size={18} />
                </div>

                <div>
                  <strong>
                    Password management
                  </strong>

                  <span>
                    Password changes are
                    handled through the
                    authentication flow
                    configured for your
                    account.
                  </span>
                </div>

                <ChevronRight size={17} />
              </div>

              <div className="settings-security-note">
                <ShieldCheck size={16} />
                No password is stored or
                handled by this page.
              </div>
            </article>
          </div>
        </section>

        <section className="settings-signout-card">
          <div>
            <span className="settings-card-eyebrow">
              SESSION
            </span>

            <h2>
              Sign out of ResumeIQ
            </h2>

            <p>
              End your current
              authenticated session on
              this device.
            </p>
          </div>

          <button
            type="button"
            className="settings-danger-button"
            onClick={handleSignOut}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </section>

        {toast && (
          <div
            className={`settings-toast settings-toast--${toast.type}`}
            role="status"
            aria-live="polite"
          >
            <div className="settings-toast-icon">
              <Check size={16} />
            </div>

            <span>
              {toast.message}
            </span>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default Settings;