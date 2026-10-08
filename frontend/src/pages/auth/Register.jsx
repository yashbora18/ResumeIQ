import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../../services/authService";
import { useToast } from "../../components/toast/ToastContext";

import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      showError("Please complete all required fields.");
      return;
    }

    if (fullName.length < 2) {
      showError("Please enter your full name.");
      return;
    }

    if (!email.includes("@")) {
      showError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      showError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        fullName,
        email,
        password,
      });

      success(
        "Account created successfully. Redirecting to sign in..."
      );

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      showError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-shell">
        <div className="register-form-panel">
          <div className="register-form-container">
            <Link
              className="register-mobile-brand"
              to="/"
              aria-label="ResumeIQ home"
            >
              <span className="register-mobile-brand__mark">
                <FileText size={18} />
              </span>

              <span>ResumeIQ</span>
            </Link>

            <div className="register-form-header">
              <span className="register-eyebrow">
                CREATE YOUR WORKSPACE
              </span>

              <h1>Build your career intelligence.</h1>

              <p>
                Create your ResumeIQ account and start turning
                your resume into actionable career insight.
              </p>
            </div>

            <form
              className="register-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="register-field">
                <label htmlFor="register-name">
                  Full name
                </label>

                <div className="register-input-wrapper">
                  <UserRound
                    className="register-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="register-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="register-input-wrapper">
                  <Mail
                    className="register-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="register-input-wrapper">
                  <LockKeyhole
                    className="register-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
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
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>

                <div className="register-input-wrapper">
                  <LockKeyhole
                    className="register-input-icon"
                    size={18}
                    strokeWidth={1.8}
                  />

                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="register-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      className="register-submit__spinner"
                      size={18}
                    />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="register-form-footer">
              <span>Already have an account?</span>

              <Link to="/login">
                Sign in
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <div className="register-brand-panel">
          <Link
            className="register-brand"
            to="/"
            aria-label="ResumeIQ home"
          >
            <span className="register-brand__mark">
              <FileText size={20} strokeWidth={2.2} />
            </span>

            <span>ResumeIQ</span>
          </Link>

          <div className="register-brand-content">
            <span className="register-brand-eyebrow">
              <Sparkles size={14} />
              YOUR CAREER, DECIPHERED
            </span>

            <h2>
              Don't just send
              <span> another resume.</span>
            </h2>

            <p>
              Understand what your resume communicates,
              discover its strengths, identify gaps, and
              measure how closely it aligns with the roles you
              want.
            </p>

            <div className="register-feature-list">
              <div className="register-feature">
                <span className="register-feature__number">
                  01
                </span>

                <div>
                  <strong>Analyze</strong>

                  <p>
                    Get structured AI insights from your actual
                    resume.
                  </p>
                </div>
              </div>

              <div className="register-feature">
                <span className="register-feature__number">
                  02
                </span>

                <div>
                  <strong>Compare</strong>

                  <p>
                    Understand how your profile matches target
                    opportunities.
                  </p>
                </div>
              </div>

              <div className="register-feature">
                <span className="register-feature__number">
                  03
                </span>

                <div>
                  <strong>Improve</strong>

                  <p>
                    Turn analysis into concrete resume
                    improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="register-decoration">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;