import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CookieConsentProvider } from "./context/CookieConsentContext";
import CookieConsentBanner from "./components/CookieConsentBanner";
import CookiePreferencesModal from "./components/CookiePreferencesModal";
import PrivateRoute from "./utils/PrivateRoute";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard";
import GenerateTask from "./components/GenerateTask";
import Template from "./components/Template";
import Validation from "./components/Validation";
import Export from "./components/Export";
import History from "./components/History";
import AIWidget from "./components/AIWidget";
import OnboardingModal from "./components/OnboardingModal";
import CommandPalette, { useCommandShortcuts } from "./components/CommandPalette";
import OAuthSuccess from "./pages/OAuthSuccess";
import UserMenu from "./components/UserMenu";

function RobotLogo({ size = 40 }) {
  return (
    <div className="robot-logo" style={{ width: size, height: size }}>
      <svg className="robot-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect className="robot-body" x="10" y="16" width="28" height="22" rx="4" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" />
        <path className="robot-antenna" d="M24 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle className="robot-antenna-tip" cx="24" cy="8" r="3" fill="currentColor" />
        <circle className="robot-eye robot-eye-left" cx="18" cy="26" r="2.5" fill="currentColor" />
        <circle className="robot-eye robot-eye-right" cx="30" cy="26" r="2.5" fill="currentColor" />
        <path d="M18 33h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path className="robot-arm robot-arm-left" d="M10 24H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path className="robot-arm robot-arm-right" d="M38 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const renderIcon = (type) => {
  const iconProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };

  switch (type) {
    case "home":
      return (
        <svg {...iconProps}>
          <path d="M3 10a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 7V3.5L4 10h16L12 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "generate":
      return (
        <svg {...iconProps}>
          <path d="M5 21h14a1 1 0 0 0 1-1v-11a1 1 0 0 0-.293-.707l-6-6A1 1 0 0 0 13 2H6a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 2v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 12.5 15.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m11 4 2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "templates":
      return (
        <svg {...iconProps}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M8 7v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "validation":
      return (
        <svg {...iconProps}>
          <path d="M12 21c4.97 0 9-4.03 9-9V5.5L12 2 3 5.5V12c0 4.97 4.03 9 9 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m9.5 12.5 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "export":
      return (
        <svg {...iconProps}>
          <path d="M12 3v13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="m8 9 4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "history":
      return (
        <svg {...iconProps}>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12A9 9 0 1 1 12 3a9 9 0 0 1 9 9Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "logout":
      return (
        <svg {...iconProps}>
          <path d="M16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M5 19h4a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
};

function MainLayout() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [task, setTask] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [aiTemplateDraft, setAiTemplateDraft] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Show onboarding modal on every login (not just first visit)
  useEffect(() => {
    setShowOnboarding(true);

    const path = window.location.pathname;
    const pageMap = {
      "/": "dashboard",
      "/dashboard": "dashboard",
      "/generate": "generate",
      "/templates": "templates",
      "/validation": "validation",
      "/export": "export",
      "/history": "history"
    };
    if (pageMap[path]) {
      setCurrentPage(pageMap[path]);
    }
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.history.pushState(null, "", `/${page === "dashboard" ? "" : page}`);
  };

  useCommandShortcuts({
    onNavigate: handleNavigate,
    onOpenAI: () => setShowAI(true),
    onTogglePalette: () => setCommandPaletteOpen((v) => !v),
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-layout-new">
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onNavigate={handleNavigate}
          onOpenAI={() => setShowAI(true)}
        />
      )}
      
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <button
            type="button"
            className="header-logo"
            onClick={() => handleNavigate("dashboard")}
            aria-label="Go to dashboard"
          >
            <RobotLogo size={40} />
            <span className="header-title">EduCode</span>
          </button>
        </div>

        <div className="header-center">
        </div>

        <div className="header-right">
          <UserMenu
            user={user}
            open={userMenuOpen}
            onToggle={() => setUserMenuOpen((v) => !v)}
            onClose={() => setUserMenuOpen(false)}
            onNavigate={handleNavigate}
            onLogout={logout}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-new" key={currentPage}>
        {currentPage === "dashboard" && (
          <Dashboard onNavigate={handleNavigate} onOpenAI={() => setShowAI(true)} />
        )}
        {currentPage === "generate" && (
          <GenerateTask task={task} setTask={setTask} onNavigate={handleNavigate} />
        )}
        {currentPage === "templates" && (
          <Template
            onNavigate={handleNavigate}
            aiTemplateDraft={aiTemplateDraft}
            onDraftConsumed={() => setAiTemplateDraft(null)}
          />
        )}
        {currentPage === "validation" && <Validation onNavigate={handleNavigate} />}
        {currentPage === "export" && <Export onNavigate={handleNavigate} />}
        {currentPage === "history" && <History onNavigate={handleNavigate} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavigate("dashboard")}
          aria-label="Home"
        >
          <span className="nav-icon">{renderIcon("home")}</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`bottom-nav-item ${currentPage === "generate" ? "active" : ""}`}
          onClick={() => handleNavigate("generate")}
          aria-label="Generate Task"
        >
          <span className="nav-icon">{renderIcon("generate")}</span>
          <span className="nav-label">Generate</span>
        </button>
        <button
          className={`bottom-nav-item ${currentPage === "templates" ? "active" : ""}`}
          onClick={() => handleNavigate("templates")}
          aria-label="Templates"
        >
          <span className="nav-icon">{renderIcon("templates")}</span>
          <span className="nav-label">Templates</span>
        </button>
        <button
          className={`bottom-nav-item ${currentPage === "validation" ? "active" : ""}`}
          onClick={() => handleNavigate("validation")}
          aria-label="Validation"
        >
          <span className="nav-icon">{renderIcon("validation")}</span>
          <span className="nav-label">Validate</span>
        </button>
        <button
          className={`bottom-nav-item ${currentPage === "export" ? "active" : ""}`}
          onClick={() => handleNavigate("export")}
          aria-label="Export"
        >
          <span className="nav-icon">{renderIcon("export")}</span>
          <span className="nav-label">Export</span>
        </button>
      </nav>

      <AIWidget
        showAI={showAI}
        setShowAI={setShowAI}
        onTemplateGenerated={(template) => {
          setAiTemplateDraft(template);
          setShowAI(false);
          handleNavigate("templates");
        }}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenAI={() => setShowAI(true)}
      />

      <button
        type="button"
        className="cmd-palette-hint"
        onClick={() => setCommandPaletteOpen(true)}
        aria-label="Open command palette"
        title="Command palette (Ctrl+K)"
      >
        <kbd>Ctrl+K</kbd>
      </button>
    </div>
  );
}

function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />

            <Route element={<PrivateRoute />}>
              <Route path="/" element={<MainLayout />} />
              <Route path="/generate" element={<MainLayout />} />
              <Route path="/templates" element={<MainLayout />} />
              <Route path="/validation" element={<MainLayout />} />
              <Route path="/export" element={<MainLayout />} />
              <Route path="/history" element={<MainLayout />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        {/* Cookie Consent Components - rendered outside routes for global access */}
        <CookieConsentBanner />
        <CookiePreferencesModal />
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;