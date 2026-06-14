import { useEffect, useState } from "react";
import { tasksAPI } from "../api/client";
import {
  IconTasks,
  IconTemplate,
  IconBolt,
  IconShield,
  IconExport,
  IconChevronRight,
  IconRobot,
} from "./icons";

const PATH_NODES = [
  { id: "templates", label: "Templates", icon: IconTemplate, hint: "Create your format first" },
  { id: "generate", label: "Generate", icon: IconBolt, hint: "Use a template or go custom" },
  { id: "validation", label: "Validate", icon: IconShield, hint: "Test your task" },
  { id: "export", label: "Export", icon: IconExport, hint: "Share with students" },
];

export default function Dashboard({ onNavigate, onOpenAI }) {
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.getAll()
      .then((res) => setRecentTasks((res.data || []).slice(0, 3)))
      .catch((err) => console.error("Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1>Welcome back</h1>
          <p>Build a template, generate a task, then validate and export.</p>
        </div>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => onNavigate("templates")}>
            Create Template
          </button>
          <button className="btn-secondary" onClick={() => onNavigate("history")}>
            View All Tasks
          </button>
        </div>
      </div>

      <section className="path-visual">
        <div className="path-visual-track">
          {PATH_NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="path-visual-group">
                <button
                  type="button"
                  className="path-node"
                  onClick={() => onNavigate(node.id)}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="path-node-icon"><Icon width={22} height={22} /></span>
                  <span className="path-node-label">{node.label}</span>
                  <span className="path-node-hint">{node.hint}</span>
                </button>
                {i < PATH_NODES.length - 1 && <span className="path-connector" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
        <button type="button" className="path-ai-btn" onClick={() => onOpenAI?.()}>
          <IconRobot width={18} height={18} />
          AI Assistant
        </button>
      </section>

      <div className="recent-activity-section">
        <div className="section-header-row">
          <h2 className="section-title">Recent Tasks</h2>
          {recentTasks.length > 0 && (
            <button type="button" className="section-link-btn" onClick={() => onNavigate("history")}>
              View All <IconChevronRight width={16} height={16} />
            </button>
          )}
        </div>

        {recentTasks.length > 0 ? (
          <div className="activity-list">
            {recentTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="activity-item clickable"
                onClick={() => onNavigate("history")}
              >
                <div className="activity-icon-svg"><IconTasks /></div>
                <div className="activity-details">
                  <div className="activity-title">{task.title}</div>
                  <div className="activity-meta">{task.language} Â· {task.difficulty}</div>
                </div>
                <div className="activity-status">
                  {task.is_validated ? (
                    <span className="badge badge-passed">Passed</span>
                  ) : (
                    <span className="badge badge-pending">Pending</span>
                  )}
                </div>
                <span className="activity-view"><IconChevronRight /></span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="empty-action-card" onClick={() => onNavigate("templates")}>
            <div className="empty-action-icon"><IconTemplate width={28} height={28} /></div>
            <h3>Start with a template</h3>
            <p>Create your template first, then generate tasks from it.</p>
            <span className="empty-action-cta">
              Open Templates <IconChevronRight width={16} height={16} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}