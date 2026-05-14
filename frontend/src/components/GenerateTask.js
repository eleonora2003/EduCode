import { useState } from "react";
import API from "../api/client";

export default function GenerateTask({ task, setTask }) {
  const [language, setLanguage] = useState("Python");
  const [concept, setConcept] = useState("Loops");
  const [difficulty, setDifficulty] = useState("Basic");
  const [template, setTemplate] = useState("Default Template");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  const generate = async () => {
    setLoading(true);
    setTask("");

    try {
      const res = await API.post("/generate-task", {
        language,
        concept,
        difficulty
      });

      setTask(res.data.task);
    } catch (err) {
      console.error(err);
      setTask("Error generating task.");
    }

    setLoading(false);
  };

  return (
    <div className="page-content">
      <div className="form-card">
        <h2>Generate Programming Task</h2>

        <div className="form-group">
          <label>Programming Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>Python</option>
            <option>Java</option>
          </select>
        </div>

        <div className="form-group">
          <label>Programming Concept</label>
          <select
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          >
            <option>Loops</option>
            <option>Functions</option>
            <option>Arrays</option>
            <option>OOP</option>
          </select>
        </div>

        <div className="form-group">
          <label>Difficulty Level</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Basic</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div className="form-group">
          <label>Template Selection</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option>Default Template</option>
            <option>Algorithm Challenge</option>
            <option>Data Structure Practice</option>
          </select>
        </div>

        <button className="btn-primary" onClick={generate} disabled={loading}>
          <span>▶</span> {loading ? "Generating..." : "Generate Task"}
        </button>
      </div>

      {task && (
        <div className="result-card">
          <h3>Generated Result</h3>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Task Description
            </button>
            <button
              className={`tab ${activeTab === "solution" ? "active" : ""}`}
              onClick={() => setActiveTab("solution")}
            >
              Reference Solution
            </button>
            <button
              className={`tab ${activeTab === "tests" ? "active" : ""}`}
              onClick={() => setActiveTab("tests")}
            >
              Unit Tests
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "description" && (
              <div>
                <h4>Task: Find Maximum in Array</h4>
                <p>{task}</p>
                <div className="example-section">
                  <strong>Example:</strong>
                  <pre>Input: [3, 7, 2, 9, 1]
Output: 9</pre>
                </div>
              </div>
            )}
            {activeTab === "solution" && (
              <div>
                <pre>def find_max(arr):
    if not arr:
        return None
    return max(arr)</pre>
              </div>
            )}
            {activeTab === "tests" && (
              <div>
                <pre>assert find_max([3, 7, 2, 9, 1]) == 9
assert find_max([]) == None
assert find_max([1]) == 1</pre>
              </div>
            )}
          </div>

          <button className="btn-secondary">▶ Run Validation</button>
        </div>
      )}
    </div>
  );
}