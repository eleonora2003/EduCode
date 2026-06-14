import { IconClose, IconGenerate, IconTemplate, IconShield, IconRobot, IconChevronRight } from "./icons";

export default function OnboardingModal({ onClose, onNavigate, onOpenAI }) {
  const features = [
    {
      icon: IconTemplate,
      title: "Templates",
      description: "Create your assignment format first",
      page: "templates",
    },
    {
      icon: IconGenerate,
      title: "Generate",
      description: "Build tasks from your templates",
      page: "generate",
    },
    {
      icon: IconShield,
      title: "Validate",
      description: "Run automated tests on tasks",
      page: "validation",
    },
    {
      icon: IconRobot,
      title: "AI Assistant",
      description: "Get help while you work",
      action: "ai",
    },
  ];

  const handleFeatureClick = (feature) => {
    onClose();
    if (feature.action === "ai") onOpenAI?.();
    else if (feature.page) onNavigate?.(feature.page);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <button className="onboarding-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
        <div className="onboarding-header">
          <h1>Welcome to EduCode</h1>
          <p>Templates first, then generate, validate, and export.</p>
        </div>
        <div className="onboarding-body">
          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <button key={i} type="button" className="feature-card clickable" onClick={() => handleFeatureClick(feature)}>
                  <div className="feature-icon-svg"><Icon /></div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-description">{feature.description}</div>
                  <span className="feature-go">Open <IconChevronRight width={14} height={14} /></span>
                </button>
              );
            })}
          </div>
        </div>
        <button className="btn-primary btn-large onboarding-cta" onClick={() => { onClose(); onNavigate?.("templates"); }}>
          Create a Template
        </button>
      </div>
    </div>
  );
}