import { useEffect, useState } from "react";
import API from "../api/client";
export default function Template({ onNavigate, aiTemplateDraft, onDraftConsumed }) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("Python");
  const [concept, setConcept] = useState("Loops");
  const [difficulty, setDifficulty] = useState("Basic");
  const [learningGoals, setLearningGoals] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [codeTemplate, setCodeTemplate] = useState(
    `def solution(input_data):\n    """\n    TODO: Implement your solution here\n    """\n    pass`
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [stepError, setStepError] = useState("");

  const steps = [
    "Basic Information",
    "Learning Goals",
    "Restrictions",
    "Code Template",
    "Review & Save",
  ];

  const isStepComplete = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return templateName.trim().length > 0;
      case 1:
        return learningGoals.trim().length > 0;
      case 2:
        return restrictions.trim().length > 0;
      case 3:
        return codeTemplate.trim().length > 0;
      default:
        return true;
    }
  };

  const next = () => {
    if (!isStepComplete(step)) {
      setStepError("Please complete this step before moving forward.");
      return;
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
    setStepError("");
  };

  const prev = () => {
    setStep((s) => Math.max(s - 1, 0));
    setStepError("");
  };

  const loadTemplates = async () => {
    try {
      const res = await API.get("/api/templates");
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!aiTemplateDraft) return;

    const saveFromAI = async () => {
      setTemplateName(aiTemplateDraft.name || "");
      setLanguage(aiTemplateDraft.language || "Python");
     setConcept(aiTemplateDraft.concept || "Loops");
      setDifficulty(aiTemplateDraft.difficulty || "Basic");
      setLearningGoals(aiTemplateDraft.learning_goals || "");
      setRestrictions(aiTemplateDraft.restrictions || "");
      setCodeTemplate(aiTemplateDraft.code_template || codeTemplate);
      setStep(4);
      setSaveMessage("Saving template from AI assistant...");

      const description = `Language: ${aiTemplateDraft.language || "Python"}
Concept: ${aiTemplateDraft.concept || "General"}
Difficulty: ${aiTemplateDraft.difficulty || "Basic"}

Learning Goals:
${aiTemplateDraft.learning_goals || "None"}

Restrictions:
${aiTemplateDraft.restrictions || "None"}

Code Template:
${aiTemplateDraft.code_template || ""}`;

      try {
        await API.post("/api/templates", {
          name: aiTemplateDraft.name,
          description,
          difficulty: aiTemplateDraft.difficulty || "Basic",
          concept: aiTemplateDraft.concept || "General",
        });
        setSaveMessage("Template created and saved by AI assistant.");
        await loadTemplates();
      } catch (err) {
        console.error(err);
        setSaveMessage("AI filled the form but saving failed. Review and save manually.");
      } finally {
        onDraftConsumed?.();
      }
    };

    saveFromAI();
  }, [aiTemplateDraft]);


  const deleteTemplate = async (templateId) => {
  if (!window.confirm("Delete this template?")) return;

  try {
    await API.delete(`/api/templates/${templateId}`);
    setSelectedTemplate(null);
    await loadTemplates();
  } catch (err) {
    console.error("Failed to delete template", err);
    alert("Failed to delete template.");
  }
};

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveMessage("Please enter a template name before saving.");
      return;
    }

    const description = `Language: ${language}
Concept: ${concept}
Difficulty: ${difficulty}

Learning Goals:
${learningGoals || "None"}

Restrictions:
${restrictions || "None"}

Code Template:
${codeTemplate}`;

    setIsSaving(true);
    setSaveMessage("");

    try {
      await API.post("/api/templates", {
        name: templateName,
        description,
        difficulty,
        concept,
      });

      setSaveMessage("Template saved successfully.");
      setTemplateName("");
      setLearningGoals("");
      setRestrictions("");
      setCodeTemplate(
        `def solution(input_data):\n    """\n    TODO: Implement your solution here\n    """\n    pass`
      );
      setStep(0);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setSaveMessage("Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Template Editor</h2>
          <p>Create and customize task templates</p>
        </div>
      </div>

      <div className="hero-panel template-hero">
        <div>
          <h3>Build templates for consistent lessons</h3>
          <p>Use templates when you want tasks to follow a familiar format, include learning goals, and reuse starter code across assignments.</p>
        </div>
        <div>
          <strong>Tip:</strong> Click any step above to jump between setup stages. This wizard keeps your template creation fast and interactive.
        </div>
      </div>

      <div className="progress-steps" role="tablist" aria-label="Template steps">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`step ${i <= step ? "active" : ""} ${i > step ? "disabled" : ""}`}
            onClick={() => i <= step && setStep(i)}
            disabled={i > step}
            aria-current={i === step ? "step" : undefined}
          >
            <div className="step-circle">{i < step ? "✓" : i + 1}</div>
            <div className="step-label">{label}</div>
          </button>
        ))}
      </div>

      <div className="form-card">
        <div className="carousel-container" style={{ position: "relative" }}>
          <button className="carousel-arrow left" onClick={prev} aria-label="previous">
            ‹
          </button>

          <div style={{ padding: 8 }}>
            {step === 0 && (
              <div>
                <h3>Basic Information</h3>
                <p className="form-subtitle">Set up template name and programming language</p>

                <div className="form-group">
                  <label htmlFor="template-name">Template Name</label>
                  <input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    type="text"
                    placeholder="e.g., Advanced Algorithm Challenge"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="programming-language">Programming Language</label>
                  <select id="programming-language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option>Python</option>
                    <option>Java</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="concept">Concept</label>
                  <select id="concept" value={concept} onChange={(e) => setConcept(e.target.value)}>
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

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option>Basic</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3>Learning Goals</h3>
                <p className="form-subtitle">Define what students should learn</p>

                <div className="form-group">
                  <label htmlFor="learning-goals">Learning Goals</label>
                  <textarea
                    id="learning-goals"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    placeholder="Define the learning objectives for this template..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3>Restrictions</h3>
                <p className="form-subtitle">Add constraints and limitations</p>

                <div className="form-group">
                  <label htmlFor="restrictions">Restrictions</label>
                  <textarea
                    id="restrictions"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="Specify any constraints or limitations..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3>Code Template</h3>
                <p className="form-subtitle">Define the starter code structure</p>

                <div className="form-group">
                  <label htmlFor="code-template">Code Structure Template</label>
                  <textarea
                    id="code-template"
                    value={codeTemplate}
                    onChange={(e) => setCodeTemplate(e.target.value)}
                    style={{ minHeight: 180, fontFamily: "Courier New, monospace" }}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3>Review & Save</h3>
                <p className="form-subtitle">Review your template before saving</p>

                <div style={{ background: "#fff8e6", padding: 18, borderRadius: 8 }}>
                  <p>
                    <strong>Template Name</strong>
                    <br />
                    {templateName || "Not set"}
                  </p>
                  <p>
                    <strong>Language</strong>
                    <br />
                    {language}
                  </p>
                  <p>
                    <strong>Concept</strong>
                    <br />
                    {concept}
                  </p>
                  <p>
                    <strong>Difficulty</strong>
                    <br />
                    {difficulty}
                  </p>
                  <p>
                    <strong>Learning Goals</strong>
                    <br />
                    {learningGoals || "Not set"}
                  </p>
                  <p>
                    <strong>Restrictions</strong>
                    <br />
                    {restrictions || "Not set"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            className="carousel-arrow right"
            onClick={next}
            aria-label="next"
            disabled={step >= steps.length - 1 || !isStepComplete(step)}
          >
            ›
          </button>
        </div>

        {stepError && (
          <p style={{ marginTop: 12, color: "#b91c1c", textAlign: "center" }}>
            {stepError}
          </p>
        )}

        {step === steps.length - 1 && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button
              className="btn-primary btn-small"
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Template"}
            </button>

            {saveMessage && (
              <p style={{ marginTop: 12, color: "#374151" }}>{saveMessage}</p>
            )}
          </div>
        )}
      </div>

      <div className="templates-list">
  <h3>Existing Templates</h3>

  {templates.length === 0 ? (
    <p className="no-content">No templates saved yet.</p>
  ) : (
    templates.map((template) => (
      <div key={template.template_id} className="template-item">
        <div>
          <h4>{template.name}</h4>

          {selectedTemplate?.template_id === template.template_id && (
            <div style={{ marginTop: 10 }}>
              <p><strong>Concept:</strong> {template.concept}</p>
              <p><strong>Difficulty:</strong> {template.difficulty}</p>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                {template.description}
              </pre>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-edit"
            type="button"
            onClick={() =>
              setSelectedTemplate(
                selectedTemplate?.template_id === template.template_id
                  ? null
                  : template
              )
            }
          >
            {selectedTemplate?.template_id === template.template_id ? "Hide" : "View"}
          </button>

          <button
            className="btn-edit"
            type="button"
            onClick={() => deleteTemplate(template.template_id)}
            style={{ background: "#fee2e2", color: "#b91c1c" }}
          >
            Delete
          </button>
        </div>
      </div>
    ))
  )}
  </div>

    </div>
  );
}