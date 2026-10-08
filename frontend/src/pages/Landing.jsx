import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  FileSearch,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./Landing.css";

function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";

  const [theme, setTheme] = useState(currentTheme);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("resumeiq-theme", nextTheme);
    setTheme(nextTheme);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const features = [
    {
      icon: BrainCircuit,
      number: "01",
      title: "AI Resume Intelligence",
      description:
        "Understand what your resume communicates through structured AI-powered analysis.",
    },
    {
      icon: Target,
      number: "02",
      title: "ATS Readiness",
      description:
        "Evaluate your resume against ATS-oriented structure, keywords, and content signals.",
    },
    {
      icon: BarChart3,
      number: "03",
      title: "Actionable Scoring",
      description:
        "Turn resume analysis into clear scores, strengths, weaknesses, and recommendations.",
    },
    {
      icon: FileSearch,
      number: "04",
      title: "Job Matching",
      description:
        "Compare your actual resume profile against target job descriptions and discover gaps.",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload",
      description:
        "Add your existing PDF or DOCX resume to your private ResumeIQ workspace.",
    },
    {
      number: "02",
      icon: Sparkles,
      title: "Analyze",
      description:
        "ResumeIQ extracts your profile and evaluates it using AI-powered analysis.",
    },
    {
      number: "03",
      icon: Zap,
      title: "Improve",
      description:
        "Use evidence-based insights to strengthen your resume and target better opportunities.",
    },
  ];

  return (
    <main className="landing-page">
      <div className="landing-noise" />

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="landing-nav">
        <div className="landing-container landing-nav__inner">
          <Link
            to="/"
            className="landing-brand"
            aria-label="ResumeIQ home"
          >
            <span className="landing-brand__mark">
              <FileSearch size={19} strokeWidth={2.2} />
            </span>

            <span>ResumeIQ</span>
          </Link>

          <nav className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#intelligence">Intelligence</a>
          </nav>

          <div className="landing-nav__actions">
            <button
              type="button"
              className="landing-theme-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {/* SIGN IN → LOGIN */}
            <Link
              to="/login"
              className="landing-login"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="landing-nav-cta"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="landing-mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="landing-mobile-nav">
            <a
              href="#features"
              onClick={closeMobile}
            >
              Features
            </a>

            <a
              href="#workflow"
              onClick={closeMobile}
            >
              How it works
            </a>

            <a
              href="#intelligence"
              onClick={closeMobile}
            >
              Intelligence
            </a>

            {/* MOBILE SIGN IN → LOGIN */}
            <Link
              to="/login"
              onClick={closeMobile}
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="landing-mobile-nav__cta"
              onClick={closeMobile}
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="landing-hero">
        <div className="landing-hero__glow landing-hero__glow--one" />
        <div className="landing-hero__glow landing-hero__glow--two" />

        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__content">
            <div className="landing-badge">
              <span className="landing-badge__dot" />
              AI-powered resume intelligence
            </div>

            <h1>
              Your resume.
              <br />
              <span>Understood.</span>
              <br />
              Improved.
            </h1>

            <p>
              ResumeIQ turns your resume into structured career
              intelligence — revealing strengths, gaps, ATS readiness,
              and how closely your profile matches real opportunities.
            </p>

            <div className="landing-hero__actions">
              <Link
                to="/register"
                className="landing-primary-button"
              >
                Analyze my resume
                <ArrowRight size={18} />
              </Link>

              <a
                href="#workflow"
                className="landing-secondary-button"
              >
                See how it works
                <ChevronDown size={17} />
              </a>
            </div>

            <div className="landing-hero__trust">
              <ShieldCheck size={17} />

              <span>
                Built around your actual resume data
              </span>
            </div>
          </div>

          {/* PRODUCT VISUAL */}

          <div className="landing-product">
            <div className="landing-product__top">
              <div>
                <span>RESUME ANALYSIS</span>
                <strong>Profile intelligence</strong>
              </div>

              <span className="landing-product__live">
                <i />
                Live
              </span>
            </div>

            <div className="landing-score">
              <div className="landing-score__ring">
                <div>
                  <strong>AI</strong>
                  <span>INSIGHT</span>
                </div>
              </div>

              <div className="landing-score__content">
                <span>Analysis dimensions</span>

                <div className="landing-score__row">
                  <span>ATS readiness</span>

                  <div>
                    <i style={{ width: "84%" }} />
                  </div>
                </div>

                <div className="landing-score__row">
                  <span>Technical profile</span>

                  <div>
                    <i style={{ width: "91%" }} />
                  </div>
                </div>

                <div className="landing-score__row">
                  <span>Project strength</span>

                  <div>
                    <i style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-product__divider" />

            <div className="landing-insight">
              <div className="landing-insight__icon">
                <Sparkles size={17} />
              </div>

              <div>
                <span>AI INSIGHT</span>

                <p>
                  Discover where your resume communicates
                  strongest evidence — and where it needs more
                  clarity.
                </p>
              </div>
            </div>

            <div className="landing-product__grid">
              <div>
                <span>Strengths</span>

                <strong>
                  <Check size={14} />
                  Evidence-based
                </strong>
              </div>

              <div>
                <span>Next move</span>

                <strong>
                  <ArrowRight size={14} />
                  Improve
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-scroll">
          <span>SCROLL TO EXPLORE</span>
          <div />
        </div>
      </section>

      {/* =====================================================
          CAPABILITY STRIP
      ===================================================== */}

      <section className="landing-capabilities">
        <div className="landing-container landing-capabilities__grid">
          <div>
            <span>01</span>
            <strong>Resume parsing</strong>
          </div>

          <div>
            <span>02</span>
            <strong>AI analysis</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Career insights</strong>
          </div>

          <div>
            <span>04</span>
            <strong>Job matching</strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="features"
        className="landing-section"
      >
        <div className="landing-container">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-label">
                WHAT RESUMEIQ SEES
              </span>

              <h2>
                More than a resume
                <span> checker.</span>
              </h2>
            </div>

            <p>
              ResumeIQ transforms a document into a structured view
              of your professional profile so you can make better
              career decisions.
            </p>
          </div>

          <div className="landing-features">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className="landing-feature"
                  key={feature.number}
                >
                  <div className="landing-feature__top">
                    <span>{feature.number}</span>

                    <div className="landing-feature__icon">
                      <Icon size={21} />
                    </div>
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>

                  <span className="landing-feature__arrow">
                    <ArrowRight size={17} />
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section
        id="workflow"
        className="landing-workflow"
      >
        <div className="landing-container">
          <div className="landing-section-heading landing-section-heading--center">
            <span className="landing-section-label">
              THE WORKFLOW
            </span>

            <h2>
              From document
              <span> to direction.</span>
            </h2>

            <p>
              A simple workflow designed to turn your existing resume
              into useful career intelligence.
            </p>
          </div>

          <div className="landing-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  className="landing-step"
                  key={step.number}
                >
                  <div className="landing-step__number">
                    {step.number}
                  </div>

                  <div className="landing-step__icon">
                    <Icon size={24} />
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>

                  {index !== steps.length - 1 && (
                    <ArrowRight
                      className="landing-step__connector"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          INTELLIGENCE
      ===================================================== */}

      <section
        id="intelligence"
        className="landing-intelligence"
      >
        <div className="landing-container landing-intelligence__grid">
          <div className="landing-intelligence__content">
            <span className="landing-section-label">
              INTELLIGENCE LAYER
            </span>

            <h2>
              Know what your resume
              <span> says about you.</span>
            </h2>

            <p>
              ResumeIQ combines resume extraction, structured
              analysis, scoring, and job matching into one focused
              workspace.
            </p>

            <ul>
              <li>
                <Check size={17} />
                Structured resume information
              </li>

              <li>
                <Check size={17} />
                Evidence-based AI feedback
              </li>

              <li>
                <Check size={17} />
                Strength and gap identification
              </li>

              <li>
                <Check size={17} />
                Job-specific matching insights
              </li>
            </ul>

            <Link
              to="/register"
              className="landing-primary-button"
            >
              Explore ResumeIQ
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="landing-intelligence__visual">
            <div className="landing-orbit landing-orbit--one" />
            <div className="landing-orbit landing-orbit--two" />
            <div className="landing-orbit landing-orbit--three" />

            <div className="landing-intelligence-card">
              <BrainCircuit size={26} />

              <span>RESUMEIQ ENGINE</span>

              <strong>
                Resume
                <br />
                intelligence
              </strong>

              <small>
                Extract · Analyze · Match · Improve
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta__inner">
            <div className="landing-cta__glow" />

            <span className="landing-section-label">
              READY WHEN YOU ARE
            </span>

            <h2>
              Make your resume
              <br />
              work <span>smarter.</span>
            </h2>

            <p>
              Upload your resume and start understanding your
              professional profile with ResumeIQ.
            </p>

            <Link
              to="/register"
              className="landing-primary-button landing-primary-button--large"
            >
              Start with ResumeIQ
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <Link
            to="/"
            className="landing-brand"
          >
            <span className="landing-brand__mark">
              <FileSearch size={18} />
            </span>

            <span>ResumeIQ</span>
          </Link>

          <span className="landing-footer__copy">
            AI-powered resume intelligence.
          </span>

          <div className="landing-footer__links">
            <a href="#features">
              Features
            </a>

            <a href="#workflow">
              How it works
            </a>

            {/* FOOTER SIGN IN → LOGIN */}
            <Link to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Landing;