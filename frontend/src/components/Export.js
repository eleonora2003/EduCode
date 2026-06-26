import { useState, useEffect } from "react";
import { tasksAPI, exportAPI } from "../api/client";
export default function Export({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [exportFormat, setExportFormat] = useState("markdown");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(t => t.id));
    }
  };

  const handleExport = async () => {
    if (selectedTasks.length === 0) {
      alert("Please select at least one task to export");
      return;
    }

    setExporting(true);
    try {
      const response = await exportAPI.exportTasks({
        task_ids: selectedTasks,
        format: exportFormat
      });
      const mimeType =
        exportFormat === "pdf"
          ? "application/pdf"
          : exportFormat === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : exportFormat === "moodle_xml"
          ? "application/xml"
          : "text/markdown";

      const blob = new Blob([response.data], {
        type: mimeType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edocode_tasks_${new Date().toISOString().slice(0,10)}.${
        exportFormat === "pdf"
          ? "pdf"
          : exportFormat === "docx"
          ? "docx"
          : exportFormat === "moodle_xml"
          ? "xml"
          : "md"
      }`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
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
          <h2>Export Tasks</h2>
          <p>Export your programming tasks in various formats</p>
        </div>
      </div>

      {/* Export Settings */}
      <div className="form-card">
        <h2>Export Settings</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Export Format</label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="pdf">PDF Document (.pdf)</option>
              <option value="moodle_xml">Moodle XML (.xml)</option>
              <option value="docx">Word Document (.docx)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Selected Tasks</label>
            <div style={{ padding: '10px 0' }}>
              {selectedTasks.length} of {tasks.length} tasks selected
            </div>
          </div>
        </div>
        <button 
          className="btn-primary btn-large" 
          onClick={handleExport}
          disabled={selectedTasks.length === 0 || exporting}
        >
          {exporting ? "Exporting..." : "Export Selected Tasks"}
        </button>
      </div>

      {/* Tasks List */}
      <div className="table-card">
        <h3>Select Tasks to Export</h3>
        
        {tasks.length === 0 ? (
          <button
            type="button"
            className="empty-action-card"
            onClick={() => onNavigate?.("generate")}
          >
            <h3>No tasks to export yet</h3>
            <p>Generate your first task, then come back here to download it.</p>
            <span className="empty-action-cta">Go to Generate</span>
          </button>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary" 
                onClick={selectAll}
              >
                {selectedTasks.length === tasks.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedTasks.length === tasks.length && tasks.length > 0}
                      onChange={selectAll}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Concept</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td>{task.title}</td>
                    <td>{task.language}</td>
                    <td>{task.concept}</td>
                    <td>
                      <span className={`badge badge-${task.difficulty.toLowerCase()}`}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Format Info */}
      <div className="form-card" style={{ marginTop: '24px' }}>
        <h3>Export Format Information</h3>
        {exportFormat === "markdown" && (
          <div style={{ lineHeight: '1.6', color: '#374151' }}>
            <p><strong>Markdown (.md)</strong> - A lightweight markup format perfect for:</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>GitHub repositories</li>
              <li>Documentation files</li>
              <li>Easy reading in any text editor</li>
              <li>Converting to other formats</li>
            </ul>
          </div>
        )}
        {exportFormat === "pdf" && (
          <div style={{ lineHeight: '1.6', color: '#374151' }}>
            <p><strong>PDF Document (.pdf)</strong> - Professional format ideal for:</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Printing physical copies</li>
              <li>Sharing with colleagues</li>
              <li>Official documentation</li>
              <li>Preserving formatting</li>
            </ul>
          </div>
        )}
        {exportFormat === "moodle_xml" && (
          <div style={{ lineHeight: '1.6', color: '#374151' }}>
            <p><strong>Moodle XML (.xml)</strong> - Import directly into Moodle LMS:</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Import as essay questions</li>
              <li>Use in Moodle quizzes</li>
              <li>Share with Moodle courses</li>
              <li>Includes solution as feedback</li>
            </ul>
          </div>
        )}
        {exportFormat === "docx" && (
          <div style={{ lineHeight: '1.6', color: '#374151' }}>
            <p><strong>Word Document (.docx)</strong> - Professional editable document format:</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Fully editable in Microsoft Word</li>
              <li>Professional title page included</li>
              <li>Automatic page numbering</li>
              <li>Ideal for reports and assignments</li>
              <li>Preserves code formatting and structure</li>
              <li>Easy to share and print</li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}