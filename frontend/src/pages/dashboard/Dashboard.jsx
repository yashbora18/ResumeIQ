import { useEffect, useState } from "react";
import {
  FileText,
  Brain,
  Target,
  TrendingUp,
  ArrowUpRight,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getResumeStats } from "../../services/dashboardService";

import DashboardLayout from "./DashboardLayout";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await getResumeStats();

      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <main className="dashboard-page dashboard-page--state">
          <div className="dashboard-loading">
            <LoaderCircle
              className="dashboard-spinner"
              size={28}
            />

            <div>
              <strong>Loading your workspace</strong>

              <span>
                Connecting to your ResumeIQ intelligence data...
              </span>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <main className="dashboard-page dashboard-page--state">
          <div className="dashboard-error">
            <div className="dashboard-error__icon">
              <AlertCircle size={22} />
            </div>

            <div className="dashboard-error__content">
              <h2>
                We couldn't load your dashboard
              </h2>

              <p>{error}</p>

              <button
                type="button"
                className="dashboard-retry"
                onClick={loadDashboard}
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const cards = [
    {
      label: "Total Resumes",
      value: stats?.total_resumes ?? 0,
      detail: `${stats?.completed_resumes ?? 0} completed`,
      icon: FileText,
      tone: "teal",
      route: "/resumes",
    },
    {
      label: "AI Analyses",
      value: stats?.total_ai_analyses ?? 0,
      detail: `${stats?.analyzed_resumes ?? 0} resumes analyzed`,
      icon: Brain,
      tone: "amber",
      route: "/analysis",
    },
    {
      label: "Average Resume Score",
      value: stats?.average_overall_score ?? 0,
      detail: "AI evaluation score",
      icon: TrendingUp,
      tone: "green",
      route: "/analysis",
    },
    {
      label: "Job Matches",
      value: stats?.total_job_matches ?? 0,
      detail: `${stats?.average_job_match_score ?? 0}% average match`,
      icon: Target,
      tone: "blue",
      route: "/job-matches",
    },
  ];

  const statusDistribution =
    stats?.status_distribution || {};

  function handleCardClick(route) {
    navigate(route);
  }

  function handleCardKeyDown(event, route) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      navigate(route);
    }
  }

  return (
    <DashboardLayout>
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div className="dashboard-hero__content">
            <span className="dashboard-eyebrow">
              RESUME INTELLIGENCE
            </span>

            <h1>
              Turn your resume into
              <span> your advantage.</span>
            </h1>

            <p>
              Your ResumeIQ workspace gives you a clear view
              of your resume performance, AI analysis, and
              job matching activity.
            </p>
          </div>

          <div className="dashboard-hero__signal">
            <div className="dashboard-hero__signal-dot" />

            <span>
              Live workspace data
            </span>
          </div>
        </section>

        {/* =================================================
            TOP STAT CARDS
        ================================================= */}

        <section
          className="dashboard-stats"
          aria-label="Resume statistics"
        >
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className={`dashboard-stat-card dashboard-stat-card--${card.tone} dashboard-stat-card--clickable`}
                key={card.label}
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleCardClick(card.route)
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(
                    event,
                    card.route
                  )
                }
                aria-label={`Open ${card.label}`}
              >
                <div className="dashboard-stat-card__top">
                  <div className="dashboard-stat-card__icon">
                    <Icon
                      size={20}
                      strokeWidth={1.8}
                    />
                  </div>

                  <ArrowUpRight
                    className="dashboard-stat-card__arrow"
                    size={18}
                  />
                </div>

                <div className="dashboard-stat-card__value">
                  {card.value}
                </div>

                <div className="dashboard-stat-card__label">
                  {card.label}
                </div>

                <div className="dashboard-stat-card__detail">
                  {card.detail}
                </div>
              </article>
            );
          })}
        </section>

        {/* =================================================
            DASHBOARD OVERVIEW
        ================================================= */}

        <section className="dashboard-overview">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <span className="dashboard-panel__kicker">
                  RESUME PIPELINE
                </span>

                <h2>
                  Where your resumes stand
                </h2>
              </div>
            </div>

            <div className="dashboard-pipeline">
              <div className="dashboard-pipeline__item">
                <span>Uploaded</span>

                <strong>
                  {statusDistribution.uploaded ?? 0}
                </strong>
              </div>

              <div className="dashboard-pipeline__item">
                <span>Parsed</span>

                <strong>
                  {statusDistribution.parsed ?? 0}
                </strong>
              </div>

              <div className="dashboard-pipeline__item">
                <span>Completed</span>

                <strong>
                  {statusDistribution.completed ?? 0}
                </strong>
              </div>

              <div className="dashboard-pipeline__item">
                <span>Failed</span>

                <strong>
                  {statusDistribution.failed ?? 0}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================================
              CLICKABLE LATEST ANALYSIS
          ================================================= */}

          <div
            className="dashboard-panel dashboard-panel--highlight dashboard-latest-analysis dashboard-latest-analysis--clickable"
            role="button"
            tabIndex={0}
            onClick={() =>
              navigate("/analysis")
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                navigate("/analysis");
              }
            }}
            aria-label="Open latest AI analysis"
          >
            <span className="dashboard-panel__kicker">
              LATEST ANALYSIS
            </span>

            <div className="dashboard-score">
              <strong>
                {stats?.latest_score ?? "—"}
              </strong>

              <span>/100</span>
            </div>

            {stats?.latest_resume ? (
              <>
                <h2
                  title={
                    stats.latest_resume.filename
                  }
                >
                  {stats.latest_resume.filename}
                </h2>

                <p>
                  Latest resume status:{" "}
                  <strong>
                    {
                      stats.latest_resume
                        .processing_status
                    }
                  </strong>
                </p>
              </>
            ) : (
              <p>
                No resume has been uploaded yet.
              </p>
            )}

            <ArrowUpRight
              className="dashboard-latest-analysis__arrow"
              size={20}
            />
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default Dashboard;