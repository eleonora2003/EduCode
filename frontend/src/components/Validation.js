import { useEffect, useState } from "react";
import { tasksAPI, validationAPI } from "../api/client";

const VIcon = ({ type }) => {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
  if (type === "validate") {
    return (
      <svg {...p}>
        <path d="M12 21c4.97 0 9-4.03 9-9V5.5L12 2 3 5.5V12c0 4.97 4.03 9 9 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9.5 12.5 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "passed") {
    return (
      <svg {...p} width="20" height="20">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="m8.5 12.5 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "failed") {
    return (
      <svg {...p} width="20" height="20">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
};

export default function Validation({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  });

  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [fixingTaskId, setFixingTaskId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [aiFixNotes, setAiFixNotes] = useState("");

  useEffect(() => {
    fetchTasks();

    const id = sessionStorage.getItem("runValidationId");

    if (id) {
      const taskId = Number(id);
      setSelectedTaskId(taskId);
      runValidation(taskId);
      sessionStorage.removeItem("runValidationId");
    }

    const interval = setInterval(() => {
      fetchTasks();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await tasksAPI.getAll();
      const data = res.data || [];
      setTasks(data);
      updateStats(data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const updateStats = (data) => {
    const total = data.length;
    const passed = data.filter((t) => t.status === "passed").length;
    const failed = data.filter((t) => t.status === "failed").length;
    const pending = data.filter(
      (t) => !t.status || t.status === "pending" || t.status === "running"
    ).length;

    setStats({ total, passed, failed, pending });
  };

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) || null;

  const runValidation = async (taskId, force = true) => {
    setLoadingTaskId(taskId);
    setSelectedTaskId(taskId);
    setStatusMessage("Running validation in sandbox...");
    setValidationResult(null);

    try {
      const res = await validationAPI.validateSolution(taskId, force);
      const result = res.data || {};
      setValidationResult(result);
      setStatusMessage(
        result.passed
          ? "Validation passed — all tests succeeded."
          : "Validation failed — review the failure details below."
      );
      fetchTasks();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const logs = err.response?.data?.logs;
      const message =
        logs ||
        (typeof detail === "string"
          ? detail
          : JSON.stringify(detail, null, 2)) ||
        err.message ||
        "Validation failed";

      setValidationResult({
        passed: false,
        logs: message,
        failure_reason: message,
      });
      setStatusMessage("Validation request failed.");
      fetchTasks();
    }

    setLoadingTaskId(null);
  };

  const fixWithAI = async (taskId) => {
    setFixingTaskId(taskId);
    setStatusMessage("Sending failure details to OpenAI and rewriting code...");

    try {
      const res = await validationAPI.fixWithAI(taskId);
      const data = res.data || {};

      setAiFixNotes(data.explanation || data.message || "Code rewritten by AI.");
      setStatusMessage(
        data.message || "Solution and tests rewritten. Re-running validation..."
      );

      await fetchTasks();
      await runValidation(taskId, true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setStatusMessage(
        typeof detail === "string"
          ? detail
          : "Could not rewrite code with AI. Try again."
      );
    }

    setFixingTaskId(null);
  };

  const selectTask = (task) => {
    setSelectedTaskId(task.id);
    setValidationResult(task.validation_result || null);
    setAiFixNotes("");

    let message;
    if (!task.validation_result) {
      message = "Select Run Validation to test this task.";
    } else if (task.validation_result.passed) {
      message = "Last run passed.";
    } else {
      message = "Last run failed — see details below.";
    }
    setStatusMessage(message);
  };

  const toggleExpandDetails = (taskId, event) => {
    event.stopPropagation();
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

    const getStatusVariant = (message) => {
    if (/fail/i.test(message)) return "error";
    if (/passed/i.test(message)) return "success";
    return "info";
  };

  const getStatusIcon = (variant, message) => {
    if (variant === "success") return <VIcon type="passed" />;
    if (variant === "error") return <VIcon type="failed" />;
    if (/running|sending|\.\.\.$/i.test(message)) return <span className="table-inline-spinner" />;
    return <VIcon type="validate" />;
  };

  const getStatusBadge = (status) => {
    if (status === "passed") return "badge badge-passed";
    if (status === "failed") return "badge badge-failed";
    if (status === "running") return "badge badge-medium";
    return "badge badge-pending";
  };

  const getDifficultyBadge = (diff) => {
    if (!diff) return "badge badge-basic";
    return `badge badge-${diff.toLowerCase()}`;
  };

  const displayResult = validationResult || selectedTask?.validation_result;
  const canFixWithAI =
    selectedTask &&
    displayResult &&
    !displayResult.passed &&
    loadingTaskId !== selectedTask.id &&
    fixingTaskId !== selectedTask.id;

  return (
    <div className="page-content">
      <div className="page-header validation-page-header">
        <div>
          <span className="validation-eyebrow">Quality assurance</span>
          <h2>Validation Dashboard</h2>
          <p>Run sandbox tests, inspect failures, and rewrite broken code with AI.</p>
        </div>
        <div className="validation-header-summary" aria-label="Validation summary">
          <span>{stats.passed + stats.failed} reviewed</span>
          <span>{stats.pending} awaiting validation</span>
        </div>
      </div>

      <div className="stats-grid validation-stats-grid">
        <div className="stat-card">
          <div className="stat-card-topline">
            <div className="stat-label">Total Tasks</div>
            <span className="stat-index">01</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-caption">Tasks in the validation queue</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-topline">
            <div className="stat-label">Passed</div>
            <span className="stat-index">02</span>
          </div>
          <div className="stat-value" style={{ color: "#22c55e" }}>{stats.passed}</div>
          <div className="stat-caption">Completed without test failures</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-topline">
            <div className="stat-label">Failed</div>
            <span className="stat-index">03</span>
          </div>
          <div className="stat-value" style={{ color: "#ef4444" }}>{stats.failed}</div>
          <div className="stat-caption">Require review or an AI fix</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-topline">
            <div className="stat-label">Pending</div>
            <span className="stat-index">04</span>
          </div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>{stats.pending}</div>
          <div className="stat-caption">Not yet fully validated</div>
        </div>
      </div>

      <div className="validation-layout">
        <div className="table-card validation-task-list">
          <div className="validation-section-heading">
            <div>
              <span className="validation-section-kicker">Queue</span>
              <h3>Tasks</h3>
            </div>
            <span className="validation-task-count">{tasks.length} total</span>
          </div>

          {tasks.length === 0 ? (
            <button
              type="button"
              className="empty-action-card"
              onClick={() => onNavigate?.("generate")}
            >
              <h3>No tasks to validate</h3>
              <p>Generate a task first, then run validation here.</p>
              <span className="empty-action-cta">Go to Generate</span>
            </button>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Tests</th>
                  <th>Actions</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <>
                    <tr
                      key={task.id}
                      className={
                        selectedTaskId === task.id ? "validation-row-selected" : ""
                      }
                      onClick={() => selectTask(task)}
                    >
                      <td>
                        <div className="validation-task-name">
                          <span className="validation-task-title">{task.title}</span>
                          <span className="validation-task-id">Task #{task.id}</span>
                        </div>
                      </td>
                      <td><span className="validation-language">{task.language}</span></td>
                      <td>
                        <span className={getStatusBadge(task.status)}>
                          {task.status || "pending"}
                        </span>
                      </td>
                      <td>
                        {task.passed_tests || 0}/{task.total_tests || 0}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="link-view"
                          onClick={(event) => {
                            event.stopPropagation();
                            runValidation(task.id, true);
                          }}
                          disabled={loadingTaskId === task.id}
                        >
                          {loadingTaskId === task.id ? (
                            <span className="table-inline-spinner" />
                          ) : (
                            <VIcon type="validate" />
                          )}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`validation-details-toggle ${expandedTaskId === task.id ? 'expanded' : ''}`}
                          onClick={(event) => toggleExpandDetails(task.id, event)}
                          title="Toggle details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                    {expandedTaskId === task.id && (
                      <tr className="validation-details-row">
                        <td colSpan="6">
                          <div className="validation-details-content">
                            <div className="validation-details-header">
                              <div>
                                <span className="validation-section-kicker">Task Details</span>
                                <h4>{task.title}</h4>
                                <div className="validation-detail-meta">
                                  <span className={getDifficultyBadge(task.difficulty)}>
                                    {task.difficulty}
                                  </span>
                                  <span>{task.language}</span>
                                  {task.execution_time && (
                                    <span>{task.execution_time}s</span>
                                  )}
                                </div>
                              </div>
                              <div className="validation-details-actions">
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    runValidation(task.id, true);
                                  }}
                                  disabled={loadingTaskId === task.id}
                                >
                                  {loadingTaskId === task.id
                                    ? "Running..."
                                    : "Run Validation"}
                                </button>
                                {task.validation_result && !task.validation_result.passed && loadingTaskId !== task.id && fixingTaskId !== task.id && (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      fixWithAI(task.id);
                                    }}
                                    disabled={fixingTaskId === task.id}
                                  >
                                    {fixingTaskId === task.id
                                      ? "Rewriting..."
                                      : "Fix with AI"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {task.validation_result ? (
                              <div className="validation-results-grid">
                                <div
                                  className={`validation-result-card ${
                                    task.validation_result.passed
                                      ? "validation-result-passed"
                                      : "validation-result-failed"
                                  }`}
                                >
                                  <div className="validation-result-label">Result</div>
                                  <div className="validation-result-value">
                                    <span className={`validation-result-icon ${task.validation_result.passed ? "icon-passed" : "icon-failed"}`}>
                                      <VIcon type={task.validation_result.passed ? "passed" : "failed"} />
                                    </span>
                                    {task.validation_result.passed ? "Passed" : "Failed"}
                                  </div>
                                  <div className="validation-result-sub">
                                    {task.validation_result.passed_tests || 0}/
                                    {task.validation_result.total_tests || 0} tests
                                  </div>
                                </div>

                                {!task.validation_result.passed && task.validation_result.failure_reason && (
                                  <div className="validation-result-card validation-result-failed">
                                    <div className="validation-result-label">Why it failed</div>
                                    <pre className="validation-failure-reason">
                                      {task.validation_result.failure_reason}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="validation-no-result">
                                <VIcon type="validate" />
                                <span>No validation results yet. Run validation to see results.</span>
                              </div>
                            )}

                            {task.validation_result?.logs && (
                              <div className="logs-card validation-logs-card">
                                <h3>Full Execution Logs</h3>
                                <pre>{task.validation_result.logs}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

      
      </div>

    </div>
  );
}