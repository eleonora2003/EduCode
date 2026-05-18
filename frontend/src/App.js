import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./utils/PrivateRoute";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import GenerateTask from "./components/GenerateTask";
import Template from "./components/Template";
import Validation from "./components/Validation";
import Export from "./components/Export";
import History from "./components/History";
import { useAuth } from "./context/AuthContext";

function MainLayout() {
  const [currentPage, setCurrentPage] = useState("generate");
  const [task, setTask] = useState("");
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <img src="/logo.svg" alt="logo" className="logo" />
          <span className="logo-text">AI Task Generator</span>
        </div>
        
        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === "generate" ? "active" : ""}`}
            onClick={() => setCurrentPage("generate")}
          >
            <span className="nav-icon">▶</span>
            <span>Generate Task</span>
          </button>
          <button
            className={`nav-item ${currentPage === "templates" ? "active" : ""}`}
            onClick={() => setCurrentPage("templates")}
          >
            <span className="nav-icon">◆</span>
            <span>Templates</span>
          </button>
          <button
            className={`nav-item ${currentPage === "validation" ? "active" : ""}`}
            onClick={() => setCurrentPage("validation")}
          >
            <span className="nav-icon">✓</span>
            <span>Validation</span>
          </button>
          <button
            className={`nav-item ${currentPage === "export" ? "active" : ""}`}
            onClick={() => setCurrentPage("export")}
          >
            <span className="nav-icon">↗</span>
            <span>Export</span>
          </button>
          <button
            className={`nav-item ${currentPage === "history" ? "active" : ""}`}
            onClick={() => setCurrentPage("history")}
          >
            <span className="nav-icon">⏱</span>
            <span>History</span>
          </button>
          <button className="nav-item" onClick={logout}>
            <span className="nav-icon">⇦</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === "generate" && (
          <GenerateTask task={task} setTask={setTask} />
        )}
        {currentPage === "templates" && <Template />}
        {currentPage === "validation" && <Validation />}
        {currentPage === "export" && <Export />}
        {currentPage === "history" && <History />}
      </main>
    </div>
  );
}

export default function App() {
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

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}