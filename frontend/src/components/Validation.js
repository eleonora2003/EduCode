import { useEffect, useState } from "react";
import { tasksAPI, validationAPI } from "../api/client";

export default function Validation({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
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
    setStatusMessage(
      task.validation_result
        ? task.validation_result.passed
          ? "Last run passed."
          : "Last run failed — see details below."
        : "Select Run Validation to test this task."
    );
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
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
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
                        {loadingTaskId === task.id ? "Running..." : "Validate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="validation-detail-panel">
          {!selectedTask ? (
            <div className="validation-empty-panel">
              <div className="validation-empty-icon"><VIcon type="validate" /></div>
              <span className="validation-section-kicker">Inspector</span>
              <h3>Validation Details</h3>
              <p>Select a task to inspect results or run validation.</p>
            </div>
          ) : (
            <>
              <div className="validation-detail-header">
                <div>
                  <span className="validation-section-kicker">Selected task</span>
                  <h3>{selectedTask.title}</h3>
                  <div className="validation-detail-meta">
                    <span className={getDifficultyBadge(selectedTask.difficulty)}>
                      {selectedTask.difficulty}
                    </span>
                    <span>{selectedTask.language}</span>
                    {selectedTask.execution_time && (
                      <span>{selectedTask.execution_time}s</span>
                    )}
                  </div>
                </div>

                <div className="validation-detail-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => runValidation(selectedTask.id, true)}
                    disabled={loadingTaskId === selectedTask.id}
                  >
                    {loadingTaskId === selectedTask.id
                      ? "Running..."
                      : "Run Validation"}
                  </button>

                  {canFixWithAI && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => fixWithAI(selectedTask.id)}
                      disabled={fixingTaskId === selectedTask.id}
                    >
                      {fixingTaskId === selectedTask.id
                        ? "Rewriting..."
                        : "Fix with AI"}
                    </button>
                  )}
                </div>
              </div>

              {statusMessage && (
                <div className="validation-status-banner">{statusMessage}</div>
              )}

              {displayResult && (
                <div className="validation-results-grid">
                  <div
                    className={`validation-result-card ${
                      displayResult.passed
                        ? "validation-result-passed"
                        : "validation-result-failed"
                    }`}
                  >
                    <div className="validation-result-label">Result</div>
                    <div className="validation-result-value">
                      {displayResult.passed ? "Passed" : "Failed"}
                    </div>
                    <div className="validation-result-sub">
                      {displayResult.passed_tests || 0}/
                      {displayResult.total_tests || 0} tests
                    </div>
                  </div>

                  {!displayResult.passed && displayResult.failure_reason && (
                    <div className="validation-result-card validation-result-failed">
                      <div className="validation-result-label">Why it failed</div>
                      <pre className="validation-failure-reason">
                        {displayResult.failure_reason}
                      </pre>
                    </div>
                  )}

                  {aiFixNotes && (
                    <div className="validation-result-card">
                      <div className="validation-result-label">AI rewrite notes</div>
                      <pre className="validation-failure-reason">{aiFixNotes}</pre>
                    </div>
                  )}
                </div>
              )}

              {displayResult?.logs && (
                <div className="logs-card validation-logs-card">
                  <h3>Full Execution Logs</h3>
                  <pre>{displayResult.logs}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
