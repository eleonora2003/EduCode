import { useState, useEffect } from "react";
import { tasksAPI, validationAPI, templatesAPI } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function GenerateTask({ task, setTask, onNavigate }) {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("");
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [generatedData, setGeneratedData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [taskId, setTaskId] = useState(null); 
  const [isSaving, setIsSaving] = useState(false); 
  const [isValidating, setIsValidating] = useState(false); 
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await templatesAPI.getAll();
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const selectedTemplate = templates.find(
    (t) => t.template_id === Number(template)
  );

  const generate = async () => {
    if (!template && (!language || !concept || !difficulty)) {
  alert("Please select Language, Concept, and Difficulty level OR select a template.");
  return;
    }

    setLoading(true);
    setTask("");
    setGeneratedData(null);
    setSaved(false);

    try {
      const res = await tasksAPI.generate({
        language: selectedTemplate?.description?.match(/Language:\s*(.*)/)?.[1] || language,
concept: selectedTemplate?.concept || concept,
difficulty: selectedTemplate?.difficulty || difficulty,
template_id: template ? Number(template) : null,
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
    if (!generatedData || isSaving || saved) return;

    setIsSaving(true);
    try {
      const res = await tasksAPI.create({
        title: generatedData.title,
        description: generatedData.description,
        language: selectedTemplate?.description?.match(/Language:\s*(.*)/)?.[1] || language,
        concept: selectedTemplate?.concept || concept,
        difficulty: selectedTemplate?.difficulty || difficulty,
        template_name: selectedTemplate?.name || "",
        examples: generatedData.examples,
        solution: generatedData.solution,
        tests: generatedData.tests,
      });

      setTaskId(res.data.id);
      setSaved(true);
    } catch (err) {
      console.error("Error saving task:", err);
      if (err.response?.status === 422) {
        alert("Failed to save task: Validation error. Check console for details.");
      } else {
        alert("Failed to save task. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validateSolution = async () => {
    if (!generatedData || isValidating) return;

    setIsValidating(true);

    try {
      let currentTaskId = taskId;

      if (!currentTaskId) {
        const res = await tasksAPI.create({
          title: generatedData.title,
          description: generatedData.description,
          language: selectedTemplate?.description?.match(/Language:\s*(.*)/)?.[1] || language,
          concept: selectedTemplate?.concept || concept,
          difficulty: selectedTemplate?.difficulty || difficulty,
          template_name: selectedTemplate?.name || "",
          examples: generatedData.examples,
          solution: generatedData.solution,
          tests: generatedData.tests,
        });

        currentTaskId = res.data.id;
        setTaskId(currentTaskId);
        setSaved(true);
      }

      sessionStorage.setItem("runValidationId", currentTaskId);

      onNavigate("validation");  

    } catch (err) {
      console.error(err);
      alert("Failed to start validation.");
    } finally {
      setIsValidating(false);
    }
  };

  const getLanguageIcon = (lang) => {
    const icons = {
      Python: "🐍",
      Java: "☕",
    };

    return icons[lang] || "💻";
  };

  const getDifficultyColor = (diff) => {
    const colors = {
      Basic: "#22c55e",
      Intermediate: "#f59e0b",
      Advanced: "#ef4444",
    };

    return colors[diff] || "#6b7280";
  };

  return (
    <div className="page-content">
      <div className="form-card">
        <h2>Generate Programming Task</h2>
        <p className="form-subtitle">
          Configure the parameters and let AI generate a complete programming exercise with solution and tests.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Programming Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">-- Select Language --</option>
              <option value="Python">🐍 Python</option>
              <option value="Java">☕ Java</option>
            </select>
          </div>

          <div className="form-group">
            <label>Programming Concept</label>
            <select value={concept} onChange={(e) => setConcept(e.target.value)}>
              <option value="">-- Select Concept --</option>
              <option value="Loops">Loops</option>
              <option value="Functions">Functions</option>
              <option value="Arrays">Arrays</option>
              <option value="OOP">OOP</option>
              <option value="Recursion">Recursion</option>
              <option value="Sorting">Sorting</option>
              <option value="String Manipulation">String Manipulation</option>
              <option value="Data Structures">Data Structures</option>
              <option value="File I/O">File I/O</option>
              <option value="Error Handling">Error Handling</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Difficulty Level</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">-- Select Difficulty --</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Custom Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">-- Select Template --</option>

              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTemplate && (
          <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
            <strong>Selected template:</strong> {selectedTemplate.name}
          </div>
        )}

        <button
          className="btn-primary btn-large"
          onClick={generate}
          disabled={loading || (!template && (!language || !concept || !difficulty))}
        >
          <span>{loading ? "⏳" : "🚀"}</span>{" "}
          {loading ? "Generating with AI..." : "Generate Complete Task"}
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

              <span className="concept-badge">📚 {concept}</span>

              {selectedTemplate && (
                <span className="concept-badge">📄 {selectedTemplate.name}</span>
              )}
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
                    <span className="info-value">
                      {selectedTemplate?.name || "Default"}
                    </span>
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
            <button className="btn-secondary" onClick={validateSolution} disabled={isValidating}>
              <span>{isValidating ? "⏳" : "✓"}</span> 
              {isValidating ? "Validating..." : "Validate Solution"}
            </button>

            <button className="btn-secondary" onClick={saveTask} disabled={saved || isSaving}>
              <span>{isSaving ? "⏳" : "💾"}</span> 
              {isSaving ? "Saving..." : saved ? "✓ Saved!" : "Save to History"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                const md = `# ${generatedData.title}\n\n${generatedData.description}`;
                const blob = new Blob([md], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${generatedData.title.replace(/\s+/g, "_")}.md`;
                a.click();
              }}
            >
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
          </div>
        </div>
      )}
    </div>
  );
}