import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./utils/PrivateRoute";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import GenerateTask from "./components/GenerateTask";
import Template from "./components/Template";
import Validation from "./components/Validation";
import Export from "./components/Export";
import History from "./components/History";
import AIWidget from "./components/AIWidget";

function MainLayout() {
  const [currentPage, setCurrentPage] = useState("generate");
  const [task, setTask] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    const path = window.location.pathname;
    const pageMap = {
      "/": "generate",
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
    window.history.pushState(null, "", `/${page === "generate" ? "" : page}`);
  };

  if (!user) {
    return null;
  }

  return (
<div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="robot-icon" aria-label="robot logo">🤖</div>
          <span className="logo-text">EduCode</span>
        </div>

        {/* User Info */}
        <div className="user-section">
          <div className="user-avatar">
            {user.email ? user.email.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-info">
            <span className="user-name">
              {user.name || user.full_name || (user.email ? user.email.split('@')[0] : "User")}
            </span>
            <span className="user-email">{user.email || ""}</span>
          </div>
        </div>
        
        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === "generate" ? "active" : ""}`}
            onClick={() => handleNavigate("generate")}
          >
            <span className="nav-icon">📝</span>
            <span>Generate Task</span>
          </button>
          <button
            className={`nav-item ${currentPage === "templates" ? "active" : ""}`}
            onClick={() => handleNavigate("templates")}
          >
            <span className="nav-icon">📋</span>
            <span>Templates</span>
          </button>
          <button
            className={`nav-item ${currentPage === "validation" ? "active" : ""}`}
            onClick={() => handleNavigate("validation")}
          >
            <span className="nav-icon">✅</span>
            <span>Validation</span>
          </button>
          <button
            className={`nav-item ${currentPage === "export" ? "active" : ""}`}
            onClick={() => handleNavigate("export")}
          >
           <span className="nav-icon">📤</span>
            <span>Export</span>
          </button>
          <button
            className={`nav-item ${currentPage === "history" ? "active" : ""}`}
            onClick={() => handleNavigate("history")}
          >
            <span className="nav-icon">🕐</span>
            <span>History</span>
          </button>
          <button className="nav-item logout-btn" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === "generate" && (
          <GenerateTask task={task} setTask={setTask} onNavigate={handleNavigate} />
        )}
        {currentPage === "templates" && <Template />}
        {currentPage === "validation" && <Validation />}
        {currentPage === "export" && <Export />}
        {currentPage === "history" && <History onNavigate={handleNavigate} />}
      </main>
      <AIWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
    </AuthProvider>
  );
}

export default App;