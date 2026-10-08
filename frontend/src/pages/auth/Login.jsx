import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  loginUser,
  saveAccessToken,
} from "../../services/authService";

import { useToast } from "../../components/toast/ToastContext";

import "./Login.css";

const THEME_KEY = "resumeiq-theme";
const THEME_CHANGE_EVENT = "resumeiq-theme-change";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    success,
    error: showError,
    info,
  } = useToast();

  const [theme, setTheme] = useState(() => {
    const savedTheme =
      localStorage.getItem(THEME_KEY);

    return savedTheme === "light"
      ? "light"
      : "dark";
  });

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     APPLY THEME
  ========================================================= */

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
  }, [theme]);

  /* =========================================================
     LISTEN FOR THEME CHANGES
  ========================================================= */

  useEffect(() => {
    function handleThemeChange(event) {
      const nextTheme =
        event.detail === "light"
          ? "light"
          : "dark";

      setTheme(nextTheme);
    }

    window.addEventListener(
      THEME_CHANGE_EVENT,
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        handleThemeChange
      );
    };
  }, []);

  /* =========================================================
     TOGGLE THEME
  ========================================================= */

  function toggleTheme() {
    const nextTheme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);

    window.dispatchEvent(
      new CustomEvent(
        THEME_CHANGE_EVENT,
        {
          detail: nextTheme,
        }
      )
    );

    info(
      nextTheme === "dark"
        ? "Dark theme enabled."
        : "Light theme enabled."
    );
  }

  /* =========================================================
     REDIRECT MESSAGE
  ========================================================= */

  useEffect(() => {
    const message =
      location.state?.message;

    if (message) {
      success(message);

      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );
    }
  }, [
    location,
    navigate,
    success,
  ]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    const email =
      form.email.trim();

    const password =
      form.password;

    if (!email || !password) {
      showError(
        "Please enter your email and password."
      );
      return;
    }

    if (!email.includes("@")) {
      showError(
        "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await loginUser({
          email,
          password,
        });

      const token =
        data?.access_token ||
        data?.token;

      if (!token) {
        throw new Error(
          "Login succeeded, but no authentication token was returned."
        );
      }

      saveAccessToken(token);

      success(
        "Signed in successfully. Welcome back!"
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      showError(
        err?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     BACK TO LANDING
  ========================================================= */

  function handleBack() {
    navigate("/");
  }

  return (
    <main className="login-page">
      {/* =====================================================
          TOP CONTROLS
      ===================================================== */}

      <div className="login-page__controls">
        <button
          type="button"
          className="login-page__control"
          onClick={handleBack}
          aria-label="Back to home"
          title="Back to home"
        >
          <ArrowLeft size={19} />
        </button>

        <button
          type="button"
          className="login-page__control"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          title={
            theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
        >
          {theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </div>

      {/* =====================================================
          LOGIN SHELL
      ===================================================== */}

      <section className="login-shell">
        {/* ===================================================
            BRAND PANEL
        =================================================== */}

        <div className="login-brand-panel">
          <Link
            className="login-brand"
            to="/"
            aria-label="ResumeIQ home"
          >
            <span className="login-brand__mark">
              <FileText
                size={20}
                strokeWidth={2.2}
              />
            </span>

            <span>
              ResumeIQ
            </span>
          </Link>

          <div className="login-brand-panel__content">
            <span className="login-eyebrow">
              <Sparkles size={14} />
              RESUME INTELLIGENCE
            </span>

            <h1>
              Make your resume
              <span>
                {" "}
                work harder.
              </span>
            </h1>

            <p>
              Analyze your resume,
              uncover opportunities,
              and understand how
              your profile performs
              against real career
              requirements.
            </p>
          </div>

          <div className="login-brand-panel__footer">
            <span className="login-orbit login-orbit--one" />
            <span className="login-orbit login-orbit--two" />
            <span className="login-orbit login-orbit--three" />

            <div className="login-signal">
              <span className="login-signal__dot" />

              <span>
                AI-powered career
                intelligence
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            FORM PANEL
        =================================================== */}

        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-form-header">
              <span className="login-mobile-brand">
                RESUMEIQ
              </span>

              <h2>
                Welcome back.
              </h2>

              <p>
                Sign in to continue
                to your resume
                intelligence
                workspace.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* EMAIL */}

              <div className="login-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <div className="login-input-wrapper">
                  <Mail
                    className="login-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>
                </div>

                <div className="login-input-wrapper">
                  <LockKeyhole
                    className="login-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="login-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      className="login-submit__spinner"
                      size={18}
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in

                    <ArrowRight
                      size={18}
                    />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER */}

            <div className="login-form-footer">
              <span>
                Don't have an
                account?
              </span>

              <Link to="/register">
                Create one

                <ArrowRight
                  size={15}
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;