import { useState } from "react";
import "./styles.css";

import GenerateTask from "./components/GenerateTask";
import Template from "./components/Template";
import Validation from "./components/Validation";
import Export from "./components/Export";
import History from "./components/History";

export default function App() {
  const [currentPage, setCurrentPage] = useState("generate");
  const [task, setTask] = useState("");

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