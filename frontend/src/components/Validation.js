export default function Validation() {
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
          <div className="stat-value">24</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ color: "#22c55e" }}>
            18
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>
            3
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            3
          </div>
        </div>
      </div>

      <div className="table-card">
        <h3>Generated Tasks</h3>
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
            <tr>
              <td>Find Maximum in Array</td>
              <td>Python</td>
              <td><span className="badge badge-basic">Basic</span></td>
              <td><span className="badge badge-passed">✓ Passed</span></td>
              <td>4/4</td>
              <td>0.043s</td>
              <td><button className="link-view">View Logs</button></td>
            </tr>
            <tr>
              <td>Binary Search Implementation</td>
              <td>Java</td>
              <td><span className="badge badge-medium">Medium</span></td>
              <td><span className="badge badge-passed">✓ Passed</span></td>
              <td>8/8</td>
              <td>0.127s</td>
              <td><button className="link-view">View Logs</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="logs-card">
        <h3>Recent Execution Logs</h3>
        <pre>[2026-05-10 14:32:15] Running validation for task: Find Maximum in Array
[2026-05-10 14:32:16] Docker container started: container_abc123
[2026-05-10 14:32:16] Executing test suite...
[2026-05-10 14:32:17] ✓ test_basic_array passed
[2026-05-10 14:32:17] ✓ test_empty_array passed</pre>
      </div>
    </div>
  );
}