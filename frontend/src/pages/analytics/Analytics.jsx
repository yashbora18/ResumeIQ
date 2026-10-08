import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";

import DashboardLayout from "../dashboard/DashboardLayout";

import "./Analytics.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "resumeiq-access-token";

const EMPTY_STATS = {
  total_resumes: 0,
  analyzed_resumes: 0,
  pending_resumes: 0,
  completed_resumes: 0,
  processing_resumes: 0,
  failed_resumes: 0,
  total_ai_analyses: 0,
  average_overall_score: 0,
  total_job_matches: 0,
  average_job_match_score: 0,
  latest_resume: null,
  latest_score: null,
  status_distribution: {
    uploaded: 0,
    processing: 0,
    analyzing: 0,
    parsed: 0,
    completed: 0,
    failed: 0,
  },
};

function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

async function getAnalyticsStats() {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}/resumes/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    throw new Error(
      data?.detail || "Unable to load analytics right now."
    );
  }

  return data;
}

function formatScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

function formatDate(value) {
  if (!value) {
    return "No resume activity yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status) {
  const labels = {
    uploaded: "Uploaded",
    processing: "Processing",
    analyzing: "Analyzing",
    parsed: "Parsed",
    completed: "Completed",
    failed: "Failed",
  };

  return labels[status] || "Unknown";
}

function getStatusTone(status) {
  const tones = {
    uploaded: "neutral",
    processing: "blue",
    analyzing: "amber",
    parsed: "teal",
    completed: "green",
    failed: "red",
  };

  return tones[status] || "neutral";
}

function Analytics() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const loadAnalytics = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getAnalyticsStats();

      setStats({
        ...EMPTY_STATS,
        ...data,
        status_distribution: {
          ...EMPTY_STATS.status_distribution,
          ...(data?.status_distribution || {}),
        },
      });

      if (showRefreshToast) {
        setToast({
          type: "success",
          message: "Analytics refreshed successfully.",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load analytics.";

      setError(message);

      if (showRefreshToast) {
        setToast({
          type: "error",
          message,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const statusItems = useMemo(
    () => [
      {
        key: "completed",
        label: "Completed",
        value: Number(stats.status_distribution.completed || 0),
        tone: "green",
        icon: CheckCircle2,
      },
      {
        key: "parsed",
        label: "Parsed",
        value: Number(stats.status_distribution.parsed || 0),
        tone: "teal",
        icon: FileText,
      },
      {
        key: "processing",
        label: "Processing",
        value: Number(stats.status_distribution.processing || 0),
        tone: "blue",
        icon: Activity,
      },
      {
        key: "analyzing",
        label: "Analyzing",
        value: Number(stats.status_distribution.analyzing || 0),
        tone: "amber",
        icon: Sparkles,
      },
      {
        key: "uploaded",
        label: "Uploaded",
        value: Number(stats.status_distribution.uploaded || 0),
        tone: "neutral",
        icon: Clock3,
      },
      {
        key: "failed",
        label: "Failed",
        value: Number(stats.status_distribution.failed || 0),
        tone: "red",
        icon: XCircle,
      },
    ],
    [stats.status_distribution]
  );

  const maxStatusValue = Math.max(
    1,
    ...statusItems.map((item) => item.value)
  );

  const completedPercentage =
    stats.total_resumes > 0
      ? Math.round(
          (Number(stats.completed_resumes || 0) /
            Number(stats.total_resumes || 1)) *
            100
        )
      : 0;

  const analysisCoverage =
    stats.total_resumes > 0
      ? Math.round(
          (Number(stats.analyzed_resumes || 0) /
            Number(stats.total_resumes || 1)) *
            100
        )
      : 0;

  const score = Number(stats.average_overall_score || 0);
  const jobScore = Number(stats.average_job_match_score || 0);

  const insightItems = [
    {
      icon: Target,
      title: "AI analysis coverage",
      value: `${analysisCoverage}%`,
      description:
        stats.total_resumes > 0
          ? `${stats.analyzed_resumes} of ${stats.total_resumes} resumes have saved AI analysis.`
          : "Upload a resume to start building your analysis history.",
      tone: "teal",
    },
    {
      icon: TrendingUp,
      title: "Average resume score",
      value: `${formatScore(score)}/100`,
      description:
        score >= 75
          ? "Your saved AI analyses show a strong overall resume profile."
          : score >= 60
            ? "Your resume profile has a solid base with room for targeted improvement."
            : "Generate more AI analyses to understand and improve your profile.",
      tone: score >= 75 ? "green" : score >= 60 ? "amber" : "blue",
    },
    {
      icon: BarChart3,
      title: "Job matching performance",
      value: `${formatScore(jobScore)}/100`,
      description:
        stats.total_job_matches > 0
          ? `${stats.total_job_matches} saved job comparison${stats.total_job_matches === 1 ? "" : "s"} are included in this score.`
          : "Run a job comparison to start tracking your fit across opportunities.",
      tone: jobScore >= 75 ? "green" : jobScore >= 60 ? "amber" : "teal",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <main className="analytics-page analytics-page--state">
          <div className="analytics-state-card">
            <div className="analytics-spinner">
              <RefreshCw size={22} />
            </div>
            <span className="analytics-eyebrow">
              CAREER INTELLIGENCE
            </span>
            <h1>Loading your analytics</h1>
            <p>
              ResumeIQ is retrieving your real resume, analysis, and
              job-matching statistics.
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error && stats.total_resumes === 0) {
    return (
      <DashboardLayout>
        <main className="analytics-page analytics-page--state">
          <div className="analytics-state-card analytics-state-card--error">
            <div className="analytics-state-icon">
              <AlertCircle size={25} />
            </div>
            <span className="analytics-eyebrow">
              ANALYTICS UNAVAILABLE
            </span>
            <h1>We couldn't load your analytics</h1>
            <p>{error}</p>
            <button
              type="button"
              className="analytics-primary-button"
              onClick={() => loadAnalytics()}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="analytics-page">
        <section className="analytics-header">
          <div>
            <span className="analytics-eyebrow">
              CAREER INTELLIGENCE
            </span>
            <h1>Analytics</h1>
            <p>
              See how your resume portfolio, AI analysis, and job
              matching activity are performing.
            </p>
          </div>

          <button
            type="button"
            className="analytics-refresh"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "analytics-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        <section className="analytics-stat-grid">
          <article className="analytics-stat-card">
            <div className="analytics-stat-icon analytics-stat-icon--teal">
              <FileText size={19} />
            </div>
            <span>Total resumes</span>
            <strong>{stats.total_resumes}</strong>
            <small>{stats.completed_resumes} completed</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon analytics-stat-icon--blue">
              <Sparkles size={19} />
            </div>
            <span>AI analyses</span>
            <strong>{stats.total_ai_analyses}</strong>
            <small>{analysisCoverage}% coverage</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon analytics-stat-icon--green">
              <TrendingUp size={19} />
            </div>
            <span>Average resume score</span>
            <strong>{formatScore(score)}</strong>
            <small>out of 100</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon analytics-stat-icon--amber">
              <Target size={19} />
            </div>
            <span>Job matches</span>
            <strong>{stats.total_job_matches}</strong>
            <small>{formatScore(jobScore)} average score</small>
          </article>
        </section>

        <section className="analytics-main-grid">
          <article className="analytics-panel analytics-panel--overview">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-section-label">
                  PORTFOLIO HEALTH
                </span>
                <h2>Resume performance</h2>
              </div>
              <div className="analytics-panel-icon">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="analytics-score-layout">
              <div
                className="analytics-score-ring"
                style={{
                  "--score-progress": `${Math.min(
                    100,
                    Math.max(0, score)
                  )}%`,
                }}
              >
                <div className="analytics-score-ring__inner">
                  <strong>{formatScore(score)}</strong>
                  <span>/100</span>
                </div>
              </div>

              <div className="analytics-score-copy">
                <span>Average AI resume score</span>
                <strong>
                  {score >= 75
                    ? "Strong profile"
                    : score >= 60
                      ? "Solid foundation"
                      : score > 0
                        ? "Needs improvement"
                        : "No score yet"}
                </strong>
                <p>
                  This score is calculated from the AI analyses
                  saved for your resumes.
                </p>
              </div>
            </div>

            <div className="analytics-progress-list">
              <div className="analytics-progress-row">
                <div>
                  <span>Completed resumes</span>
                  <strong>{completedPercentage}%</strong>
                </div>
                <div className="analytics-progress-track">
                  <span
                    style={{
                      width: `${completedPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="analytics-progress-row">
                <div>
                  <span>AI analysis coverage</span>
                  <strong>{analysisCoverage}%</strong>
                </div>
                <div className="analytics-progress-track">
                  <span
                    style={{
                      width: `${analysisCoverage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-section-label">
                  JOB INTELLIGENCE
                </span>
                <h2>Matching performance</h2>
              </div>
              <div className="analytics-panel-icon analytics-panel-icon--blue">
                <Target size={18} />
              </div>
            </div>

            <div className="analytics-match-score">
              <div>
                <span>Average match score</span>
                <strong>{formatScore(jobScore)}</strong>
              </div>
              <div className="analytics-match-badge">
                {jobScore >= 75
                  ? "Strong"
                  : jobScore >= 60
                    ? "Moderate"
                    : jobScore > 0
                      ? "Needs work"
                      : "No matches"}
              </div>
            </div>

            <div className="analytics-match-metrics">
              <div>
                <span>Total comparisons</span>
                <strong>{stats.total_job_matches}</strong>
              </div>
              <div>
                <span>Latest score</span>
                <strong>
                  {stats.latest_score !== null &&
                  stats.latest_score !== undefined
                    ? formatScore(stats.latest_score)
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="analytics-match-note">
              <Sparkles size={16} />
              <p>
                Compare multiple job descriptions to build a clearer
                picture of where your resume is strongest.
              </p>
            </div>
          </article>
        </section>

        <section className="analytics-lower-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-section-label">
                  PROCESSING
                </span>
                <h2>Resume status</h2>
              </div>
              <div className="analytics-panel-icon">
                <Activity size={18} />
              </div>
            </div>

            <div className="analytics-status-chart">
              {statusItems.map((item) => {
                const Icon = item.icon;
                const percentage =
                  item.value > 0
                    ? Math.max(
                        5,
                        (item.value / maxStatusValue) * 100
                      )
                    : 0;

                return (
                  <div
                    className="analytics-status-row"
                    key={item.key}
                  >
                    <div className="analytics-status-label">
                      <span
                        className={`analytics-status-icon analytics-status-icon--${item.tone}`}
                      >
                        <Icon size={14} />
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="analytics-status-bar">
                      <span
                        className={`analytics-status-bar__fill analytics-status-bar__fill--${item.tone}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-section-label">
                  LATEST ACTIVITY
                </span>
                <h2>Current resume</h2>
              </div>
              <div className="analytics-panel-icon analytics-panel-icon--green">
                <FileText size={18} />
              </div>
            </div>

            {stats.latest_resume ? (
              <div className="analytics-latest">
                <div className="analytics-latest-file">
                  <div className="analytics-latest-file__icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <strong>
                      {stats.latest_resume.filename ||
                        "Resume"}
                    </strong>
                    <span>
                      Uploaded{" "}
                      {formatDate(
                        stats.latest_resume.uploaded_at
                      )}
                    </span>
                  </div>
                </div>

                <div className="analytics-latest-status">
                  <span
                    className={`analytics-status-pill analytics-status-pill--${getStatusTone(
                      stats.latest_resume.processing_status
                    )}`}
                  >
                    {getStatusLabel(
                      stats.latest_resume.processing_status
                    )}
                  </span>

                  {stats.latest_score !== null &&
                    stats.latest_score !== undefined && (
                      <div>
                        <small>Latest AI score</small>
                        <strong>
                          {formatScore(stats.latest_score)}
                          <span>/100</span>
                        </strong>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div className="analytics-inline-empty">
                <FileText size={20} />
                <p>No resume has been uploaded yet.</p>
              </div>
            )}
          </article>
        </section>

        <section className="analytics-panel analytics-insights-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="analytics-section-label">
                INSIGHTS
              </span>
              <h2>What your data says</h2>
            </div>
            <div className="analytics-panel-icon analytics-panel-icon--amber">
              <BarChart3 size={18} />
            </div>
          </div>

          <div className="analytics-insight-grid">
            {insightItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="analytics-insight-card"
                  key={item.title}
                >
                  <div
                    className={`analytics-insight-icon analytics-insight-icon--${item.tone}`}
                  >
                    <Icon size={17} />
                  </div>
                  <div>
                    <span>{item.title}</span>
                    <strong>{item.value}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {toast && (
          <div
            className={`analytics-toast analytics-toast--${toast.type}`}
            role="status"
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default Analytics;
