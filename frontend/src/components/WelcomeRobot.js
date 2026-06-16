import { useRef, useState } from "react";
import {
  IconTemplate,
  IconBolt,
  IconShield,
  IconExport,
  IconChevronRight,
} from "./icons";

const GUIDE_STEPS = [
  {
    num: 1,
    title: "What is EduCode?",
    text: "Your AI helper for building coding exercises — descriptions, solutions, and tests in minutes.",
    icon: null,
    page: null,
  },
  {
    num: 2,
    title: "Create a template",
    text: "Set your preferred layout first — language, topic, and structure.",
    icon: IconTemplate,
    page: "templates",
  },
  {
    num: 3,
    title: "Generate exercises",
    text: "Make one task or a full series that gets harder step by step.",
    icon: IconBolt,
    page: "generate",
  },
  {
    num: 4,
    title: "Validate solutions",
    text: "Run automated tests to make sure everything works before class.",
    icon: IconShield,
    page: "validation",
  },
  {
    num: 5,
    title: "Export & share",
    text: "Download or share finished exercises with your students.",
    icon: IconExport,
    page: "export",
  },
];

export default function WelcomeRobot({ onNavigate }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const leaveTimer = useRef(null);

  const openGuide = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setGuideOpen(true);
  };

  const closeGuide = () => {
    leaveTimer.current = window.setTimeout(() => setGuideOpen(false), 220);
  };

  const handleStepClick = (page) => {
    if (page && onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div
      className={`welcome-robot-zone ${guideOpen ? "guide-open" : ""}`}
      onMouseEnter={openGuide}
      onMouseLeave={closeGuide}
      onFocus={openGuide}
      onBlur={closeGuide}
    >
      <div
        className={`welcome-robot-guide ${guideOpen ? "visible" : ""}`}
        role="tooltip"
        aria-hidden={!guideOpen}
      >
        <div className="welcome-robot-guide-header">
          <span className="welcome-robot-guide-badge">Quick tour</span>
          <h3>Hi! I&apos;m EduBot 👋</h3>
          <p>Hover any step to learn the workflow — click to jump there.</p>
        </div>

        <ol className="welcome-robot-steps">
          {GUIDE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.num} style={{ "--step-delay": i }}>
                {step.page ? (
                  <button
                    type="button"
                    className="welcome-robot-step welcome-robot-step-clickable"
                    onClick={() => handleStepClick(step.page)}
                  >
                    <span className="welcome-robot-step-num">{step.num}</span>
                    <span className="welcome-robot-step-body">
                      <span className="welcome-robot-step-title">
                        {Icon && <Icon width={14} height={14} />}
                        {step.title}
                      </span>
                      <span className="welcome-robot-step-text">{step.text}</span>
                    </span>
                    <IconChevronRight width={14} height={14} className="welcome-robot-step-arrow" />
                  </button>
                ) : (
                  <div className="welcome-robot-step">
                    <span className="welcome-robot-step-num">{step.num}</span>
                    <span className="welcome-robot-step-body">
                      <span className="welcome-robot-step-title">{step.title}</span>
                      <span className="welcome-robot-step-text">{step.text}</span>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="welcome-robot-guide-footer">
          Tip: press <kbd>Ctrl+K</kbd> anywhere for quick navigation
        </div>
      </div>

      <button
        type="button"
        className="welcome-robot-trigger"
        aria-label="EduBot welcome guide — hover to see how EduCode works"
        onClick={() => setGuideOpen((prev) => !prev)}
      >
        <div className="welcome-robot-glow" aria-hidden="true" />
        <div className="welcome-robot-float">
          <svg
            className="welcome-robot-svg"
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <ellipse className="wr-shadow" cx="60" cy="148" rx="28" ry="6" fill="currentColor" opacity="0.12" />

            <rect className="wr-leg" x="38" y="118" width="14" height="26" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
            <rect className="wr-leg" x="68" y="118" width="14" height="26" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
            <rect className="wr-foot" x="34" y="140" width="22" height="8" rx="4" fill="currentColor" stroke="currentColor" strokeWidth="2" />
            <rect className="wr-foot" x="64" y="140" width="22" height="8" rx="4" fill="currentColor" stroke="currentColor" strokeWidth="2" />

            <rect className="wr-body" x="28" y="68" width="64" height="54" rx="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
            <rect className="wr-panel" x="38" y="82" width="44" height="28" rx="6" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" />
            <circle className="wr-panel-dot" cx="48" cy="96" r="3" fill="currentColor" opacity="0.35" />
            <circle className="wr-panel-dot" cx="60" cy="96" r="3" fill="currentColor" opacity="0.35" />
            <circle className="wr-panel-dot wr-panel-dot-active" cx="72" cy="96" r="3" fill="currentColor" />

            <rect className="wr-head" x="34" y="26" width="52" height="44" rx="12" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
            <path className="wr-antenna" d="M60 26V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="wr-antenna-tip" cx="60" cy="9" r="5" fill="currentColor" />

            <circle className="wr-eye wr-eye-left" cx="48" cy="46" r="5" fill="currentColor" />
            <circle className="wr-eye wr-eye-right" cx="72" cy="46" r="5" fill="currentColor" />
            <circle className="wr-eye-shine" cx="49.5" cy="44.5" r="1.5" fill="#fff" opacity="0.9" />
            <circle className="wr-eye-shine" cx="73.5" cy="44.5" r="1.5" fill="#fff" opacity="0.9" />

            <path
              className="wr-smile"
              d="M46 58 Q60 66 74 58"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            <g className="wr-arm-left" stroke="currentColor" fill="currentColor">
              <path d="M28 78 L10 94" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle className="wr-hand" cx="10" cy="94" r="6" />
            </g>

            <g className="wr-arm-right" stroke="currentColor" fill="currentColor">
              <path d="M92 78 L108 52" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle className="wr-hand wr-hand-wave" cx="108" cy="52" r="6" />
            </g>
          </svg>
        </div>
        <span className="welcome-robot-label">
          {guideOpen ? "Your guide" : "Hover me!"}
        </span>
      </button>
    </div>
  );
}
