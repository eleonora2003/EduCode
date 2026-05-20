import { useState } from "react";
import { tasksAPI, validationAPI } from "../api/client";

export default function GenerateTask({ task, setTask }) {
  const [language, setLanguage] = useState("Python");
  const [concept, setConcept] = useState("Loops");
  const [difficulty, setDifficulty] = useState("Basic");
  const [template, setTemplate] = useState("Default Template");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [generatedData, setGeneratedData] = useState(null);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    setLoading(true);
    setTask("");
    setGeneratedData(null);
    setSaved(false);

    try {
      const res = await tasksAPI.generate({
        language,
        concept,
        difficulty,
        template
      });

      setGeneratedData(res.data);
      setTask(res.data.description);
    } catch (err) {
      console.error(err);
      setTask("Error generating task. Please check your API key and try again.");
    }

    setLoading(false);
  };

  const saveTask = async () => {
    if (!generatedData) return;

    try {
      await tasksAPI.create({
        title: generatedData.title,
        description: generatedData.description,
        language: language,
        concept: concept,
        difficulty: difficulty,
        template_name: template,
        examples: generatedData.examples,
        solution: generatedData.solution,
        tests: generatedData.tests
      });
      setSaved(true);
    } catch (err) {
      console.error("Error saving task:", err);
      if (err.response?.status === 422) {
        console.error("Validation errors:", err.response.data);
        alert("Failed to save task: Validation error. Check console for details.");
      } else {
        alert("Failed to save task. Please try again.");
      }
    }
  };

  const validateSolution = async () => {
    if (!generatedData) return;

    try {
      // First save the task
      const response = await tasksAPI.create({
        title: generatedData.title,
        description: generatedData.description,
        language: language,
        concept: concept,
        difficulty: difficulty,
        template_name: template,
        examples: generatedData.examples,
        solution: generatedData.solution,
        tests: generatedData.tests
      });

      const taskId = response.data.id;

      // Then validate the solution
      const validationResponse = await validationAPI.validateSolution(taskId);
      alert(`Validation Status: ${validationResponse.data.status}`);
    } catch (err) {
      console.error("Validation error:", err);
      if (err.response?.status === 422) {
        console.error("Validation errors:", err.response.data);
        alert("Validation failed: Validation error. Check console for details.");
      } else {
        alert("Validation failed. Please check your Docker setup.");
      }
    }
  };

  const getLanguageIcon = (lang) => {
    const icons = {
      Python: "🐍",
      Java: "☕"
    };
    return icons[lang] || "💻";
  };

  const getDifficultyColor = (diff) => {
    const colors = {
      Basic: "#22c55e",
      Intermediate: "#f59e0b",
      Advanced: "#ef4444"
    };
    return colors[diff] || "#6b7280";
  };

  return (
    <div className="page-content">
      <div className="form-card">
        <h2>Generate Programming Task</h2>
        <p className="form-subtitle">Configure the parameters and let AI generate a complete programming exercise with solution and tests.</p>

        <div className="form-row">
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
              <option>Recursion</option>
              <option>Sorting</option>
              <option>String Manipulation</option>
              <option>Data Structures</option>
              <option>File I/O</option>
              <option>Error Handling</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
              <option>Real-World Problem</option>
              <option>Code Optimization</option>
            </select>
          </div>
        </div>

        <button className="btn-primary btn-large" onClick={generate} disabled={loading}>
          <span>{loading ? "⏳" : "🚀"}</span> {loading ? "Generating with AI..." : "Generate Complete Task"}
        </button>
      </div>

      {generatedData && (
        <div className="result-card">
          <div className="result-header">
            <div className="result-meta">
              <span className="language-badge">
                {getLanguageIcon(language)} {language}
              </span>
              <span 
                className="difficulty-badge" 
                style={{ backgroundColor: getDifficultyColor(difficulty) }}
              >
                {difficulty}
              </span>
              <span className="concept-badge">
                📚 {concept}
              </span>
            </div>
            <h3>{generatedData.title || "Generated Task"}</h3>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              📝 Task Description
            </button>
            <button
              className={`tab ${activeTab === "solution" ? "active" : ""}`}
              onClick={() => setActiveTab("solution")}
            >
              💡 Reference Solution
            </button>
            <button
              className={`tab ${activeTab === "tests" ? "active" : ""}`}
              onClick={() => setActiveTab("tests")}
            >
              🧪 Unit Tests
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "description" && (
              <div className="description-tab">
                <div className="task-description">
                  <p>{generatedData.description}</p>
                </div>
                {generatedData.examples && (
                  <div className="example-section">
                    <h4>Examples:</h4>
                    <pre className="example-pre">{generatedData.examples}</pre>
                  </div>
                )}
                <div className="task-info">
                  <div className="info-item">
                    <span className="info-label">Concept:</span>
                    <span className="info-value">{concept}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Template:</span>
                    <span className="info-value">{template}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "solution" && (
              <div className="solution-tab">
                {generatedData.solution ? (
                  <>
                    <div className="code-header">
                      <span className="code-language">{language} Solution</span>
                      <button 
                        className="btn-copy"
                        onClick={() => navigator.clipboard.writeText(generatedData.solution)}
                      >
                        📋 Copy Code
                      </button>
                    </div>
                    <pre className="code-block">
                      <code>{generatedData.solution}</code>
                    </pre>
                  </>
                ) : (
                  <div className="no-content">
                    <p>No solution generated. Try regenerating the task.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "tests" && (
              <div className="tests-tab">
                {generatedData.tests ? (
                  <>
                    <div className="code-header">
                      <span className="code-language">Test Cases</span>
                      <button 
                        className="btn-copy"
                        onClick={() => navigator.clipboard.writeText(generatedData.tests)}
                      >
                        📋 Copy Tests
                      </button>
                    </div>
                    <pre className="code-block">
                      <code>{generatedData.tests}</code>
                    </pre>
                  </>
                ) : (
                  <div className="no-content">
                    <p>No tests generated. Try regenerating the task.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="result-actions">
            <button className="btn-secondary" onClick={validateSolution}>
              <span>✓</span> Validate Solution
            </button>
            <button className="btn-secondary" onClick={saveTask} disabled={saved}>
              <span>💾</span> {saved ? "✓ Saved!" : "Save to History"}
            </button>
            <button className="btn-secondary" onClick={() => {
              const md = `# ${generatedData.title}\n\n${generatedData.description}`;
              const blob = new Blob([md], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${generatedData.title.replace(/\s+/g, '_')}.md`;
              a.click();
            }}>
              <span>📤</span> Export
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>AI is generating your programming task...</p>
            <p className="loading-hint">This usually takes 10-20 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}