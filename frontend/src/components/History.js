import { useState, useEffect } from "react";
import { tasksAPI } from "../api/client";

const ActionIcon = ({ type }) => {
  const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };

  switch (type) {
    case "validate":
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
    case "trash":
      return (
        <svg {...iconProps}>
          <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 7h12l-1 13.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5L6 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

export default function History({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState({ language: "", difficulty: "" });
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter.language) params.language = filter.language;
      if (filter.difficulty) params.difficulty = filter.difficulty;
      
      const response = await tasksAPI.getAll(params);
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await tasksAPI.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      fetchStatistics();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const validateTask = (task) => {
    if (!task?.id) return;

    if (task.is_validated) {
      alert(`Task is already validated!\n\n` +
            `Title: ${task.title}\n` +
            `Language: ${task.language}\n` +
            `Difficulty: ${task.difficulty}\n\n` +
            `You can view the results in the Validation dashboard.`);
      return;
    }

    sessionStorage.setItem("runValidationId", task.id);

    if (onNavigate) {
      onNavigate("validation");
    } else {
      console.warn("onNavigate prop is missing");
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      Basic: "badge-basic",
      Intermediate: "badge-medium",
      Advanced: "badge-advanced"
    };
    return badges[difficulty] || "badge-basic";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Task History</h2>
          <p>View and manage your generated programming tasks</p>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{statistics.total_tasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Validated</div>
            <div className="stat-value" style={{ color: "#22c55e" }}>
              {statistics.validated_tasks}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value" style={{ color: "#ef4444" }}>
              {statistics.failed_tasks}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: "#f59e0b" }}>
              {statistics.pending_tasks}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="form-card-history">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="filter-language">Filter by Language</label>
            <select 
              id="filter-language"
              value={filter.language} 
              onChange={(e) => setFilter({...filter, language: e.target.value})}
            >
              <option value="">All Languages</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="filter-difficulty">Filter by Difficulty</label>
            <select 
              id="filter-difficulty"
              value={filter.difficulty} 
              onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
            >
              <option value="">All Difficulties</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="table-card-history">
        <h3>Your Tasks ({tasks.length})</h3>
        
        {tasks.length === 0 ? (
          <button
            type="button"
            className="empty-action-card"
            onClick={() => onNavigate?.("generate")}
          >
            <h3>No tasks yet</h3>
            <p>Generate your first programming assignment to see it here.</p>
            <span className="empty-action-cta">Create a task</span>
          </button>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Language</th>
                <th>Concept</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <button 
                      className="link-view"
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                    >
                      {task.title}
                    </button>
                  </td>
                  <td>{task.language}</td>
                  <td>{task.concept}</td>
                  <td>
                    <span className={`badge ${getDifficultyBadge(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                  </td>
                  <td>
                    {task.is_validated ? (
                      <span className="badge badge-passed">Validated</span>
                    ) : (
                      <span className="badge badge-pending">Pending</span>
                    )}
                  </td>
                  <td>{formatDate(task.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-icon-btn"
                        onClick={() => validateTask(task)}
                        title="Validate Solution"
                        aria-label="Validate Solution"
                      >
                        <ActionIcon type="validate" />
                      </button>
                      <button
                        className="action-icon-btn"
                        onClick={() => onNavigate?.("export")}
                        title="Export Task"
                        aria-label="Export Task"
                      >
                        <ActionIcon type="export" />
                      </button>
                      <button
                        className="action-icon-btn danger"
                        onClick={() => deleteTask(task.id)}
                        title="Delete Task"
                        aria-label="Delete Task"
                      >
                        <ActionIcon type="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="result-card" style={{ marginTop: '24px' }}>
          <div className="result-header">
            <h3>{selectedTask.title}</h3>
            <p>{selectedTask.description}</p>
          </div>
          
          <div className="tabs">
            <button
              className="tab active"
              onClick={() => {}}
            >
              Description
            </button>
          </div>

          <div className="tab-content">
            {selectedTask.examples && (
              <div className="example-section">
                <h4>Examples:</h4>
                <pre className="example-pre">{selectedTask.examples}</pre>
              </div>
            )}
            
            {selectedTask.solution && (
              <div style={{ marginTop: '20px' }}>
                <div className="code-header">
                  <span className="code-language">{selectedTask.language} Solution</span>
                </div>
                <pre className="code-block">
                  <code>{selectedTask.solution}</code>
                </pre>
              </div>
            )}
            
            {selectedTask.tests && (
              <div style={{ marginTop: '20px' }}>
                <div className="code-header">
                  <span className="code-language">Test Cases</span>
                </div>
                <pre className="code-block">
                  <code>{selectedTask.tests}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}