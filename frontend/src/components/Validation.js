import { useEffect, useState } from "react";
import { tasksAPI, validationAPI } from "../api/client";
export default function Validation({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  });

  const [logs, setLogs] = useState(
    "Click 'Run Validation' to see execution details..."
  );

  const [loadingTaskId, setLoadingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();

    const id = sessionStorage.getItem("runValidationId");

    if (id) {
      runValidation(Number(id));
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
      console.log("TASKS FROM API:", res.data);
      console.log("RAW API RESPONSE:", res.data);

      setTasks(data);
      updateStats(data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const updateStats = (data) => {
    const total = data.length;
    const passed = data.filter(t => t.status === "passed").length;
    const failed = data.filter(t => t.status === "failed").length;
    const pending = data.filter(t => !t.status || t.status === "pending").length;

    setStats({ total, passed, failed, pending });
  };

  const runValidation = async (taskId) => {
    setLoadingTaskId(taskId);
    setLogs("Running validation...");

    try {
      const res = await validationAPI.validateSolution(taskId);

      const result = res.data || {};
      const formattedLogs =
        typeof result.logs === "string"
          ? result.logs
          : JSON.stringify(result, null, 2);

      const statusLine = result.passed
        ? "PASSED — all tests succeeded"
        : "FAILED — check the logs below";

      setLogs(`${statusLine}\n\n${formattedLogs}`);
      fetchTasks();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const logs = err.response?.data?.logs;
      setLogs(
        logs ||
          (typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)) ||
          err.message ||
          "Validation failed"
      );
      fetchTasks();
    }

    setLoadingTaskId(null);
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

  return (
    <div className="page-content">

      <div className="page-header">
        <div>
          <h2>Validation Dashboard</h2>
          <p>Monitor task validation status and execution logs</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ color: "#22c55e" }}>
            {stats.passed}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>
            {stats.failed}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {stats.pending}
          </div>
        </div>
      </div>

      <div className="table-card">
        <h3>Generated Tasks</h3>

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
              <th>Difficulty</th>
              <th>Status</th>
              <th>Tests</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.language}</td>

                <td>
                  <span className={getDifficultyBadge(task.difficulty)}>
                    {task.difficulty}
                  </span>
                </td>

                <td>
                  <span className={getStatusBadge(task.status)}>
                    {task.status || "pending"}
                  </span>
                </td>

                <td>
                  {task.passed_tests || 0}/{task.total_tests || 0}
                </td>

                <td>{task.execution_time ? `${task.execution_time}s` : "—"}</td>

                <td>
                  <button
                    className="link-view"
                    onClick={() => runValidation(task.id)}
                    disabled={loadingTaskId === task.id}
                  >
                    {loadingTaskId === task.id
                      ? "Running..."
                      : "Run Validation"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <div className="logs-card">
        <h3>Recent Execution Logs</h3>

        <pre>{logs}</pre>
      </div>

    </div>
  );
}