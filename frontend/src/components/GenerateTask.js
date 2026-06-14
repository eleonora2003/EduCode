import { useState, useEffect } from "react";
import { tasksAPI, validationAPI, templatesAPI } from "../api/client";
import { IconBook, IconSpark, IconPython, IconJava } from "./icons";
import PromptTuner from "./PromptTuner";

export default function GenerateTask({ task, setTask, onNavigate }) {
  const [language, setLanguage] = useState("");
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState([]);

  const [wizardStep, setWizardStep] = useState(0);
  const [useOwnTemplate, setUseOwnTemplate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [generatedData, setGeneratedData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const quickConcepts = [
    "Loops",
    "Functions",
    "Arrays",
    "OOP",
    "Recursion",
    "Data Structures",
    "File I/O",
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const loadingMessages = [
    "Reading your template...",
    "Crafting the task description...",
    "Writing the reference solution...",
    "Generating unit tests...",
    "Polishing the final details...",
  ];

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      setLoadingSeconds(0);
      return undefined;
    }

    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 3500);

    const secondTimer = setInterval(() => {
      setLoadingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(secondTimer);
    };
  }, [loading]);

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

  const wizardSteps =
    useOwnTemplate === false
      ? ["Template Mode", "Template", "Generate"]
      : ["Template Mode", "Language", "Concept", "Difficulty", "Generate"];

  const getLanguageFromTemplate = () => {
    const fromDesc = selectedTemplate?.description?.match(/Language:\s*(Python|Java)/i)?.[1];
    if (fromDesc) {
      return fromDesc.charAt(0).toUpperCase() + fromDesc.slice(1).toLowerCase();
    }
    return "Python";
  };

  const normalizeLanguage = (value) => {
    if (!value) return "Python";
    const v = String(value).trim();
    if (v.toLowerCase() === "python") return "Python";
    if (v.toLowerCase() === "java") return "Java";
    return "Python";
  };

  const getDisplayLanguage = () => {
    return normalizeLanguage(
      generatedData?.language || language || getLanguageFromTemplate()
    );
  };

  const getDisplayConcept = () => {
    return generatedData?.concept || concept || selectedTemplate?.concept || "General";
  };

  const getDisplayDifficulty = () => {
    const diff = generatedData?.difficulty || difficulty || selectedTemplate?.difficulty || "Basic";
    return ["Basic", "Intermediate", "Advanced"].includes(diff) ? diff : "Basic";
  };

  const getTunerContext = () => ({
    title: generatedData?.title || "",
    language: getDisplayLanguage(),
    concept: getDisplayConcept(),
    difficulty: getDisplayDifficulty(),
    description: generatedData?.description || "",
    examples: generatedData?.examples || "",
    solution: generatedData?.solution || "",
    tests: generatedData?.tests || "",
  });

  const handleRefined = (field, content, updatedTests) => {
    setGeneratedData((prev) => {
      const next = { ...prev, [field]: content };
      if (field === "solution" && updatedTests) {
        next.tests = updatedTests;
      }
      return next;
    });

    if (field === "description") {
      setTask(content);
    }

    if (field === "solution" && updatedTests) {
      setActiveTab("tests");
    }

    setSaved(false);
  };

  const generate = async () => {
    if (useOwnTemplate === true && (!language || !concept || !difficulty)) {
      alert("Please select Language, Concept, and Difficulty.");
      return;
    }

    if (useOwnTemplate === false && !template) {
      alert("Please select a template.");
      return;
    }

    setLoading(true);
    setTask("");
    setGeneratedData(null);
    setSaved(false);
    setTaskId(null);

    try {
      const payload =
        useOwnTemplate === true
          ? {
              language,
              concept,
              difficulty,
              template_id: null,
            }
          : {
              template_id: Number(template),
              language: getLanguageFromTemplate(),
              concept: selectedTemplate?.concept || "General",
              difficulty: selectedTemplate?.difficulty || "Basic",
            };

      const res = await tasksAPI.generate(payload);

      setGeneratedData(res.data);
      setTask(res.data.description);
      setWizardStep(useOwnTemplate ? 4 : 2);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(", ")
          : "Error generating task. Please check your API key and try again.";
      alert(message);
      setTask(message);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async () => {
    if (!generatedData || isSaving || saved) return;

    setIsSaving(true);

    try {
      const res = await tasksAPI.create({
        title: generatedData.title,
        description: generatedData.description,
        language: getDisplayLanguage(),
        concept: getDisplayConcept(),
        difficulty: getDisplayDifficulty(),
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
          language: getDisplayLanguage(),
          concept: getDisplayConcept(),
          difficulty: getDisplayDifficulty(),
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
      <div className="wizard-progress">
        {wizardSteps.map((step, i) => (
          <div
            key={i}
            className={`wizard-step ${
              i === wizardStep ? "active" : ""
            } ${i < wizardStep ? "completed" : ""}`}
          >
            <div className="wizard-circle">
              {i < wizardStep ? "✓" : i + 1}
            </div>
            <div className="wizard-label">{step}</div>
            {i < wizardSteps.length - 1 && <div className="wizard-line" />}
          </div>
        ))}
      </div>

      {wizardStep === 0 && (
        <div className="wizard-panel">
          <h2>Choose Task Source</h2>
          <p className="wizard-subtitle">
            Generate from a saved template or create a custom task.
          </p>

          <div className="template-mode-grid">
            <button
              type="button"
              className={`template-mode-card ${
                useOwnTemplate === false ? "selected" : ""
              }`}
              onClick={() => {
                setUseOwnTemplate(false);
                setLanguage("");
                setConcept("");
                setDifficulty("");
                setWizardStep(1);
              }}
            >
              <div className="mode-icon-svg"><IconBook width={32} height={32} /></div>
              <div className="mode-title">From Template</div>
              <div className="mode-subtitle">
                Generate using one of your saved templates.
              </div>
            </button>

            <button
              type="button"
              className={`template-mode-card ${
                useOwnTemplate === true ? "selected" : ""
              }`}
              onClick={() => {
                setUseOwnTemplate(true);
                setTemplate("");
                setWizardStep(1);
              }}
            >
              <div className="mode-icon-svg"><IconSpark width={32} height={32} /></div>
              <div className="mode-title">Custom Task</div>
              <div className="mode-subtitle">
                Choose language, concept, and difficulty.
              </div>
            </button>
          </div>
        </div>
      )}

      {wizardStep === 1 && useOwnTemplate === false && (
        <div className="wizard-panel">
          <h2>Select Template</h2>
          <p className="wizard-subtitle">
            Choose the template you want to generate from.
          </p>

          <div className="templates-grid">
            {templates.map((t) => (
              <button
                key={t.template_id}
                type="button"
                className={`template-card ${
                  template === String(t.template_id) ? "selected" : ""
                }`}
                onClick={() => {
                  setTemplate(String(t.template_id));
                  setWizardStep(2);
                }}
              >
                <div className="template-name">{t.name}</div>
                <div className="template-desc">
                  {t.concept || t.difficulty || "Saved template"}
                </div>
              </button>
            ))}
          </div>

          {templates.length === 0 && (
            <p className="no-content">No templates found.</p>
          )}

          <button className="btn-secondary" onClick={() => setWizardStep(0)}>
            Back
          </button>
        </div>
      )}

      {wizardStep === 2 && useOwnTemplate === false && !generatedData && (
        <div className="wizard-panel">
          <h2>Ready to Generate</h2>
          <p className="wizard-subtitle">Review your selected template.</p>

          <div className="generation-summary">
            <div className="summary-item">
              <span className="summary-label">Template:</span>
              <span className="summary-value">
                {selectedTemplate?.name || "None"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button className="btn-secondary" onClick={() => setWizardStep(1)}>
              Back
            </button>

            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate Task"}
            </button>
          </div>
        </div>
      )}

      {wizardStep === 1 && useOwnTemplate === true && (
        <div className="wizard-panel">
          <h2>Select Programming Language</h2>
          <p className="wizard-subtitle">
            Choose the language for your programming task.
          </p>

          <div className="language-grid">
            <button
              type="button"
              className={`language-card ${
                language === "Python" ? "selected" : ""
              }`}
              onClick={() => {
                setLanguage("Python");
                setWizardStep(2);
              }}
            >
              <div className="language-icon-svg"><IconPython width={36} height={36} /></div>
              <div className="language-name">Python</div>
              <div className="language-badge">Popular</div>
            </button>

            <button
              type="button"
              className={`language-card ${
                language === "Java" ? "selected" : ""
              }`}
              onClick={() => {
                setLanguage("Java");
                setWizardStep(2);
              }}
            >
              <div className="language-icon-svg"><IconJava width={36} height={36} /></div>
              <div className="language-name">Java</div>
              <div className="language-badge">Popular</div>
            </button>
          </div>

          <button className="btn-secondary" onClick={() => setWizardStep(0)}>
            Back
          </button>
        </div>
      )}

      {wizardStep === 2 && useOwnTemplate === true && (
        <div className="wizard-panel">
          <h2>Select Concept</h2>
          <p className="wizard-subtitle">Define the concept to teach.</p>

          <div className="concepts-grid">
            {quickConcepts.map((item) => (
              <button
                key={item}
                type="button"
                className={`concept-chip ${concept === item ? "active" : ""}`}
                onClick={() => {
                  setConcept(item);
                  setWizardStep(3);
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <button className="btn-secondary" onClick={() => setWizardStep(1)}>
            Back
          </button>
        </div>
      )}

      {wizardStep === 3 && useOwnTemplate === true && (
        <div className="wizard-panel">
          <h2>Select Difficulty</h2>
          <p className="wizard-subtitle">Set the difficulty level.</p>

          <div className="difficulty-grid">
            {["Basic", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                type="button"
                className={`difficulty-card ${
                  difficulty === level ? "active" : ""
                }`}
                onClick={() => {
                  setDifficulty(level);
                  setWizardStep(4);
                }}
              >
                <div className="difficulty-name">{level}</div>
              </button>
            ))}
          </div>

          <button className="btn-secondary" onClick={() => setWizardStep(2)}>
            Back
          </button>
        </div>
      )}

      {wizardStep === 4 && useOwnTemplate === true && !generatedData && (
        <div className="wizard-panel">
          <h2>Ready to Generate</h2>
          <p className="wizard-subtitle">Review your selections.</p>

          <div className="generation-summary">
            <div className="summary-item">
              <span className="summary-label">Language:</span>
              <span className="summary-value">{language}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Concept:</span>
              <span className="summary-value">{concept}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Difficulty:</span>
              <span className="summary-value">{difficulty}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Mode:</span>
              <span className="summary-value">Custom Task</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button className="btn-secondary" onClick={() => setWizardStep(3)}>
              Back
            </button>

            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate Task"}
            </button>
          </div>
        </div>
      )}

      {generatedData && (
        <div className="result-card">
          <div className="result-header">
            <div className="result-meta">
              <span className="language-badge">{getDisplayLanguage()}</span>

              <span
                className="difficulty-badge"
                style={{
                  backgroundColor: getDifficultyColor(getDisplayDifficulty()),
                }}
              >
                {getDisplayDifficulty()}
              </span>

              <span className="concept-badge">{getDisplayConcept()}</span>
            </div>

            <h3>{generatedData.title || "Generated Task"}</h3>
            <p className="prompt-tuner-intro">
              Fine-tune any section with the magic wand — select text, describe the change, and the AI updates it instantly.
            </p>
          </div>

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
              <div className="description-tab">
                <PromptTuner
                  field="description"
                  content={generatedData.description}
                  context={getTunerContext()}
                  onRefined={handleRefined}
                >
                  <div className="task-description">
                    <p>{generatedData.description}</p>
                  </div>
                </PromptTuner>

                {generatedData.examples && (
                  <PromptTuner
                    field="examples"
                    content={generatedData.examples}
                    context={getTunerContext()}
                    onRefined={handleRefined}
                    codeBlock
                  >
                    <pre className="example-pre">{generatedData.examples}</pre>
                  </PromptTuner>
                )}

                <div className="task-info">
                  <div className="info-item">
                    <span className="info-label">Concept:</span>
                    <span className="info-value">{getDisplayConcept()}</span>
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
                  <PromptTuner
                    field="solution"
                    content={generatedData.solution}
                    context={getTunerContext()}
                    onRefined={handleRefined}
                    codeBlock
                  >
                    <div className="code-header">
                      <span className="code-language">
                        {getDisplayLanguage()} Solution
                      </span>

                      <button
                        className="btn-copy"
                        onClick={() =>
                          navigator.clipboard.writeText(generatedData.solution)
                        }
                      >
                        Copy Code
                      </button>
                    </div>

                    <pre className="code-block">
                      <code>{generatedData.solution}</code>
                    </pre>
                  </PromptTuner>
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
                  <PromptTuner
                    field="tests"
                    content={generatedData.tests}
                    context={getTunerContext()}
                    onRefined={handleRefined}
                    codeBlock
                  >
                    <div className="code-header">
                      <span className="code-language">Test Cases</span>

                      <button
                        className="btn-copy"
                        onClick={() =>
                          navigator.clipboard.writeText(generatedData.tests)
                        }
                      >
                        Copy Tests
                      </button>
                    </div>

                    <pre className="code-block">
                      <code>{generatedData.tests}</code>
                    </pre>
                  </PromptTuner>
                ) : (
                  <div className="no-content">
                    <p>No tests generated. Try regenerating the task.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="result-actions">
            <button
              className="btn-secondary"
              onClick={validateSolution}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate Solution"}
            </button>

            <button
              className="btn-secondary"
              onClick={saveTask}
              disabled={saved || isSaving}
            >
              {isSaving ? "Saving..." : saved ? "Saved" : "Save to History"}
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

                URL.revokeObjectURL(url);
              }}
            >
              Export
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="generate-loading-card">
            <div className="generate-loading-robot">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="10" y="16" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M24 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="8" r="3" fill="currentColor" className="gen-antenna" />
                <circle cx="18" cy="26" r="2.5" fill="currentColor" className="gen-eye" />
                <circle cx="30" cy="26" r="2.5" fill="currentColor" className="gen-eye" />
                <path d="M18 33h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Generating your task</h3>
            <p className="generate-loading-wait">Please wait 10–20 seconds</p>
            <p className="generate-loading-step">{loadingMessages[loadingStep]}</p>
            <div className="generate-loading-bar">
              <span className="generate-loading-bar-fill" />
            </div>
            <p className="generate-loading-timer">{loadingSeconds}s elapsed</p>
          </div>
        </div>
      )}
    </div>
  );
}