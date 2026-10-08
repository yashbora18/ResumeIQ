import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import DashboardLayout from "../dashboard/DashboardLayout";
import {
  generateAIAnalysis,
  getAIAnalysis,
  getResumesForAnalysis,
} from "../../services/analysisService";

import "./Analysis.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "resumeiq-access-token";
const THEME_KEY = "resumeiq-theme";
const THEME_EVENT = "resumeiq-theme-change";

function isResumeReady(resume) {
  const status = String(resume?.processing_status || "").toLowerCase();
  return status === "parsed" || status === "completed";
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function formatList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return Math.round(number);
}

function scoreTone(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "empty";
  if (number >= 80) return "high";
  if (number >= 60) return "medium";
  return "low";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status) {
  const labels = {
    uploaded: "Uploaded",
    parsed: "Ready",
    processing: "Processing",
    analyzing: "Analyzing",
    completed: "Completed",
    failed: "Failed",
  };

  const normalized = String(status || "").toLowerCase();
  return labels[normalized] || status || "Unknown";
}

function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" ? "light" : "dark";
}

function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

async function getResumeProcessingStatus(resumeId) {
  if (!resumeId) {
    throw new Error("Resume ID is required.");
  }

  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/${encodeURIComponent(resumeId)}/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error?.message ||
        "Unable to load resume processing status."
    );
  }

  return data;
}

async function hydrateResumeStatuses(resumeList) {
  return Promise.all(
    resumeList.map(async (resume) => {
      try {
        const status = await getResumeProcessingStatus(resume.id);

        return {
          ...resume,
          processing_status:
            status.processing_status || resume.processing_status,
          has_parsed_data: Boolean(status.has_parsed_data),
          has_ai_analysis: Boolean(status.has_ai_analysis),
        };
      } catch {
        return resume;
      }
    })
  );
}

function Analysis() {
  const [resumes, setResumes] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    function syncTheme(event) {
      const next =
        event?.detail === "light" || event?.detail === "dark"
          ? event.detail
          : getTheme();

      setTheme(next);
    }

    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-resumeiq-theme", theme);
  }, [theme]);

  async function loadAnalysisPage() {
    try {
      setLoading(true);
      setError("");

      const rawResumeList = normalizeArray(
        await getResumesForAnalysis()
      );

      const resumeList = await hydrateResumeStatuses(rawResumeList);

      setResumes(resumeList);

      if (resumeList.length === 0) {
        setSelectedResumeId("");
        setAnalyses({});
        return;
      }

      const readyResume =
        resumeList.find((resume) => isResumeReady(resume)) ||
        resumeList[0];

      setSelectedResumeId((current) => {
        const exists = resumeList.some(
          (resume) => String(resume.id) === String(current)
        );

        return exists ? current : String(readyResume.id);
      });

      const results = await Promise.all(
        resumeList.map(async (resume) => {
          try {
            const analysis = await getAIAnalysis(resume.id);
            return { id: resume.id, analysis };
          } catch {
            return { id: resume.id, analysis: null };
          }
        })
      );

      const nextAnalyses = {};

      results.forEach(({ id, analysis }) => {
        nextAnalyses[id] = analysis;
      });

      setAnalyses(nextAnalyses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load AI analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedAnalysis(resumeId) {
    if (!resumeId) return;

    try {
      setAnalysisLoading(true);

      const analysis = await getAIAnalysis(resumeId);

      setAnalyses((current) => ({
        ...current,
        [resumeId]: analysis,
      }));
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("analysis not found")
      ) {
        setAnalyses((current) => ({
          ...current,
          [resumeId]: null,
        }));
        return;
      }

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to load this analysis."
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysisPage();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (
      selectedResumeId &&
      !Object.prototype.hasOwnProperty.call(
        analyses,
        selectedResumeId
      )
    ) {
      loadSelectedAnalysis(selectedResumeId);
    }
  }, [selectedResumeId]);

  useEffect(() => {
    if (!selectedResumeId) return;

    let cancelled = false;

    async function refreshSelectedResumeStatus() {
      try {
        const status = await getResumeProcessingStatus(selectedResumeId);

        if (cancelled) return;

        setResumes((current) =>
          current.map((resume) =>
            String(resume.id) === String(selectedResumeId)
              ? {
                  ...resume,
                  processing_status:
                    status.processing_status ||
                    resume.processing_status,
                  has_parsed_data: Boolean(status.has_parsed_data),
                  has_ai_analysis: Boolean(status.has_ai_analysis),
                }
              : resume
          )
        );
      } catch {
        // Keep the existing resume data if the status request fails.
      }
    }

    refreshSelectedResumeStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedResumeId]);

  useEffect(() => {
    function closeMenu(event) {
      if (!event.target.closest(".analysis-selector")) {
        setShowResumeMenu(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
  }

  const selectedResume = useMemo(
    () =>
      resumes.find(
        (resume) =>
          String(resume.id) === String(selectedResumeId)
      ),
    [resumes, selectedResumeId]
  );

  const selectedAnalysis = selectedResumeId
    ? analyses[selectedResumeId]
    : null;

  const completedAnalyses = resumes.filter(
    (resume) => analyses[resume.id]?.overall_score != null
  ).length;

  async function handleGenerateAnalysis() {
    if (!selectedResume) {
      showToast("error", "Please select a resume first.");
      return;
    }

    if (!isResumeReady(selectedResume)) {
      showToast(
        "error",
        "This resume has not finished parsing yet."
      );
      return;
    }

    try {
      setGenerating(true);

      const result = await generateAIAnalysis(selectedResume.id);

      setAnalyses((current) => ({
        ...current,
        [selectedResume.id]: result,
      }));

      setResumes((current) =>
        current.map((resume) =>
          String(resume.id) === String(selectedResume.id)
            ? {
                ...resume,
                processing_status: "completed",
                has_ai_analysis: true,
              }
            : resume
        )
      );

      showToast(
        "success",
        "AI analysis generated successfully."
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to generate AI analysis."
      );
    } finally {
      setGenerating(false);
    }
  }

  const scoreCards = [
    {
      label: "ATS Readiness",
      value: selectedAnalysis?.ats_score,
      icon: Target,
      tone: "teal",
    },
    {
      label: "Technical Profile",
      value: selectedAnalysis?.technical_score,
      icon: TrendingUp,
      tone: "green",
    },
    {
      label: "Project Strength",
      value: selectedAnalysis?.project_score,
      icon: FileText,
      tone: "amber",
    },
    {
      label: "Content Quality",
      value: selectedAnalysis?.content_score,
      icon: Sparkles,
      tone: "blue",
    },
  ];

  const strengths = formatList(selectedAnalysis?.strengths);
  const weaknesses = formatList(selectedAnalysis?.weaknesses);
  const missingSkills = formatList(selectedAnalysis?.missing_skills);
  const recommendations = formatList(selectedAnalysis?.recommendations);
  const overallScore = selectedAnalysis?.overall_score;

  if (loading) {
    return (
      <DashboardLayout>
        <main className="analysis-page analysis-page--state">
          <div className="analysis-state-card">
            <LoaderCircle className="analysis-spinner" size={30} />
            <span className="analysis-eyebrow">
              AI RESUME INTELLIGENCE
            </span>
            <h1>Loading AI intelligence</h1>
            <p>
              Fetching your real resume analysis data.
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <main className="analysis-page analysis-page--state">
          <div className="analysis-state-card analysis-state-card--error">
            <div className="analysis-state-icon">
              <AlertCircle size={25} />
            </div>
            <span className="analysis-eyebrow">
              ANALYSIS UNAVAILABLE
            </span>
            <h1>We couldn't load AI analysis</h1>
            <p>{error}</p>
            <button
              type="button"
              className="analysis-primary-button"
              onClick={loadAnalysisPage}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (resumes.length === 0) {
    return (
      <DashboardLayout>
        <main className="analysis-page analysis-page--state">
          <div className="analysis-state-card">
            <div className="analysis-state-icon analysis-state-icon--teal">
              <BrainCircuit size={27} />
            </div>
            <span className="analysis-eyebrow">
              AI RESUME INTELLIGENCE
            </span>
            <h1>Your intelligence layer is ready</h1>
            <p>
              Upload a resume first. Once ResumeIQ parses it,
              you can generate AI-powered scoring, strengths,
              gaps, and recommendations here.
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="analysis-page">
        <section className="analysis-header">
          <div>
            <span className="analysis-eyebrow">
              AI RESUME INTELLIGENCE
            </span>
            <h1>AI Analysis</h1>
            <p>
              Understand what your resume communicates, where
              it performs well, and what you should improve next.
            </p>
          </div>

          <button
            type="button"
            className="analysis-secondary-button"
            onClick={loadAnalysisPage}
            disabled={loading || analysisLoading || generating}
          >
            <RefreshCw
              size={16}
              className={
                loading ? "analysis-spinner analysis-spinner--small" : ""
              }
            />
            Refresh
          </button>
        </section>

        <section className="analysis-selector-bar">
          <div className="analysis-selector">
            <span className="analysis-selector__label">
              ANALYZING RESUME
            </span>

            <button
              type="button"
              className="analysis-selector__button"
              onClick={() =>
                setShowResumeMenu((current) => !current)
              }
            >
              <div className="analysis-selector__file">
                <FileText size={17} />
              </div>

              <div className="analysis-selector__text">
                <strong>
                  {selectedResume?.original_filename ||
                    "Select a resume"}
                </strong>
                <span>
                  Resume #{selectedResume?.id} ·{" "}
                  {getStatusLabel(
                    selectedResume?.processing_status
                  )}
                </span>
              </div>

              <ChevronDown size={17} />
            </button>

            {showResumeMenu && (
              <div className="analysis-selector__menu">
                {resumes.map((resume) => (
                  <button
                    type="button"
                    key={resume.id}
                    onClick={() => {
                      setSelectedResumeId(String(resume.id));
                      setShowResumeMenu(false);
                    }}
                  >
                    <FileText size={16} />

                    <span>
                      <strong>
                        {resume.original_filename ||
                          "Untitled resume"}
                      </strong>
                      <small>
                        #{resume.id} ·{" "}
                        {getStatusLabel(
                          resume.processing_status
                        )}
                      </small>
                    </span>

                    {String(resume.id) ===
                      String(selectedResumeId) && (
                      <CheckCircle2 size={16} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="analysis-selector-stats">
            <div>
              <strong>{resumes.length}</strong>
              <span>Resumes</span>
            </div>
            <div>
              <strong>{completedAnalyses}</strong>
              <span>Analyzed</span>
            </div>
          </div>
        </section>

        {analysisLoading ? (
          <section className="analysis-loading-panel">
            <LoaderCircle className="analysis-spinner" size={26} />
            <strong>Loading saved analysis...</strong>
            <span>Retrieving the latest AI evaluation.</span>
          </section>
        ) : !selectedAnalysis ? (
          <section className="analysis-not-ready">
            <div className="analysis-not-ready__visual">
              <BrainCircuit size={34} />
            </div>

            <div className="analysis-not-ready__content">
              <span className="analysis-eyebrow">
                READY FOR ANALYSIS
              </span>

              <h2>Unlock your resume intelligence</h2>

              <p>
                {isResumeReady(selectedResume)
                  ? "Your resume is ready. Generate an AI analysis to receive scores, strengths, weaknesses, missing skills, and actionable recommendations."
                  : "This resume is still being processed. AI analysis becomes available after parsing is complete."}
              </p>

              {isResumeReady(selectedResume) && (
                <button
                  type="button"
                  className="analysis-primary-button"
                  onClick={handleGenerateAnalysis}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="analysis-spinner"
                      />
                      Generating analysis...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Generate AI analysis
                    </>
                  )}
                </button>
              )}

              {!isResumeReady(selectedResume) && (
                <span className="analysis-processing-note">
                  <Clock3 size={15} />
                  Current status:{" "}
                  {getStatusLabel(
                    selectedResume?.processing_status
                  )}
                </span>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="analysis-overview">
              <article className="analysis-score-card">
                <div className="analysis-score-card__top">
                  <div>
                    <span>OVERALL RESUME SCORE</span>
                    <h2>Your resume at a glance</h2>
                  </div>

                  <div className="analysis-score-card__badge">
                    <BrainCircuit size={16} />
                    AI evaluated
                  </div>
                </div>

                <div className="analysis-score-main">
                  <div
                    className={`analysis-score-ring analysis-score-ring--${scoreTone(
                      overallScore
                    )}`}
                  >
                    <strong>{formatScore(overallScore)}</strong>
                    <span>/100</span>
                  </div>

                  <div className="analysis-score-copy">
                    <strong>
                      {Number(overallScore) >= 80
                        ? "Strong profile"
                        : Number(overallScore) >= 60
                          ? "Good foundation"
                          : "Needs improvement"}
                    </strong>

                    <p>
                      ResumeIQ evaluated your resume across ATS
                      readiness, technical profile, projects, and
                      content quality.
                    </p>

                    <span>
                      Last analyzed{" "}
                      {formatDate(
                        selectedAnalysis.updated_at ||
                          selectedAnalysis.created_at
                      )}
                    </span>
                  </div>
                </div>

                <div className="analysis-score-actions">
                  <button
                    type="button"
                    className="analysis-secondary-button"
                    onClick={handleGenerateAnalysis}
                    disabled={
                      generating || !isResumeReady(selectedResume)
                    }
                  >
                    {generating ? (
                      <LoaderCircle
                        size={16}
                        className="analysis-spinner"
                      />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {generating
                      ? "Regenerating..."
                      : "Regenerate analysis"}
                  </button>
                </div>
              </article>

              <div className="analysis-score-grid">
                {scoreCards.map((score) => {
                  const Icon = score.icon;
                  const numericScore = Number(score.value);
                  const width = Number.isFinite(numericScore)
                    ? Math.min(100, Math.max(0, numericScore))
                    : 0;

                  return (
                    <article
                      className={`analysis-dimension-card analysis-dimension-card--${score.tone}`}
                      key={score.label}
                    >
                      <div className="analysis-dimension-card__icon">
                        <Icon size={18} />
                      </div>

                      <span>{score.label}</span>

                      <strong>
                        {formatScore(score.value)}
                        <small>/100</small>
                      </strong>

                      <div className="analysis-progress">
                        <i style={{ width: `${width}%` }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="analysis-insight-grid">
              <article className="analysis-insight-card">
                <div className="analysis-section-heading">
                  <div className="analysis-section-heading__icon analysis-section-heading__icon--green">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <span>WHAT WORKS</span>
                    <h2>Strengths</h2>
                  </div>
                </div>

                {strengths.length > 0 ? (
                  <ul className="analysis-list">
                    {strengths.map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <CheckCircle2 size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="analysis-no-data">
                    No saved strengths were returned by the AI analysis.
                  </div>
                )}
              </article>

              <article className="analysis-insight-card">
                <div className="analysis-section-heading">
                  <div className="analysis-section-heading__icon analysis-section-heading__icon--amber">
                    <ArrowDownRight size={18} />
                  </div>
                  <div>
                    <span>IMPROVEMENT AREAS</span>
                    <h2>Weaknesses</h2>
                  </div>
                </div>

                {weaknesses.length > 0 ? (
                  <ul className="analysis-list">
                    {weaknesses.map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <ArrowDownRight size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="analysis-no-data">
                    No saved weaknesses were returned by the AI analysis.
                  </div>
                )}
              </article>

              <article className="analysis-insight-card">
                <div className="analysis-section-heading">
                  <div className="analysis-section-heading__icon analysis-section-heading__icon--blue">
                    <Target size={18} />
                  </div>
                  <div>
                    <span>SKILL GAPS</span>
                    <h2>Missing skills</h2>
                  </div>
                </div>

                {missingSkills.length > 0 ? (
                  <div className="analysis-tag-list">
                    {missingSkills.map((item, index) => (
                      <span key={`${item}-${index}`}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <div className="analysis-no-data">
                    No missing skills were returned by the AI analysis.
                  </div>
                )}
              </article>

              <article className="analysis-insight-card">
                <div className="analysis-section-heading">
                  <div className="analysis-section-heading__icon analysis-section-heading__icon--teal">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <span>NEXT STEPS</span>
                    <h2>Recommendations</h2>
                  </div>
                </div>

                {recommendations.length > 0 ? (
                  <ul className="analysis-list">
                    {recommendations.map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <Lightbulb size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="analysis-no-data">
                    No recommendations were returned by the AI analysis.
                  </div>
                )}
              </article>
            </section>

            {selectedAnalysis.ai_feedback && (
              <section className="analysis-feedback">
                <div className="analysis-section-heading">
                  <div className="analysis-section-heading__icon analysis-section-heading__icon--teal">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span>AI FEEDBACK</span>
                    <h2>ResumeIQ's assessment</h2>
                  </div>
                </div>

                <p>{selectedAnalysis.ai_feedback}</p>
              </section>
            )}
          </>
        )}

        {toast && (
          <div className={`analysis-toast analysis-toast--${toast.type}`}>
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}

            <span>{toast.message}</span>

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default Analysis;
