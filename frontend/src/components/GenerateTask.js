import { useState, useEffect } from "react";
import { tasksAPI, templatesAPI } from "../api/client";
import { IconBook, IconSpark, IconPython, IconJava } from "./icons";
import PromptTuner from "./PromptTuner";

export default function GenerateTask({ task, setTask, onNavigate }) {
  const [language, setLanguage] = useState("");
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState([]);

  const [wizardStep, setWizardStep] = useState(0);
  const [panelDirection, setPanelDirection] = useState("forward");
  const [isSelecting, setIsSelecting] = useState(false);
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

  const [generationMode, setGenerationMode] = useState("single");
  const [exerciseCount, setExerciseCount] = useState(3);
  const [exerciseSeries, setExerciseSeries] = useState(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [seriesSaved, setSeriesSaved] = useState(false);
  const [isSavingSeries, setIsSavingSeries] = useState(false);

  const quickConcepts = [
    "Loops",
    "Functions",
    "Arrays",
    "OOP",
    "Recursion",
    "Data Structures",
    "File I/O",
  ];

  const conceptInfo = {
    Loops: "Repeat actions — great for lists, counting, and patterns",
    Functions: "Bundle code into reusable steps students can call again",
    Arrays: "Store and work with lists of values",
    OOP: "Classes and objects — how real programs are structured",
    Recursion: "A function that calls itself to solve smaller pieces",
    "Data Structures": "Stacks, queues, trees — organizing data efficiently",
    "File I/O": "Read from and write to files on disk",
  };

  const difficultyInfo = {
    Basic: "Beginner-friendly — short problem, clear steps",
    Intermediate: "Needs some thinking — combines a few ideas",
    Advanced: "Challenging — multi-step logic or deeper concepts",
  };

  const exerciseCountOptions = [
    { count: 2, label: "2 exercises", desc: "Quick warm-up + one harder challenge" },
    { count: 3, label: "3 exercises", desc: "Classic lesson arc — easy to hard (recommended)" },
    { count: 4, label: "4 exercises", desc: "Longer practice with a gradual ramp-up" },
    { count: 5, label: "5 exercises", desc: "Full workshop — lots of progressive practice" },
  ];

  const seriesDifficultyPreview = (count) => {
    const levels = ["Basic", "Intermediate", "Advanced"];
    return Array.from({ length: count }, (_, i) => levels[Math.min(i, levels.length - 1)]);
  };

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

  const getSeriesLoadingMessages = (count) => {
    const planning = Array.from({ length: count }, (_, i) => {
      const num = i + 1;
      let tone;
      if (num === 1) {
        tone = "warm-up";
      } else if (num === count) {
        tone = "final challenge";
      } else {
        tone = "building skills";
      }
      return `Planning Exercise ${num} — ${tone}...`;
    });
    return [
      ...planning,
      "Writing solutions and unit tests...",
      "Finalizing your exercise series...",
    ];
  };

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

  const getWizardSteps = () => {
    if (useOwnTemplate === false) {
      return ["Start", "Template", "Create"];
    }
    if (generationMode === "series") {
      return ["Start", "Task Type", "How Many", "Language", "Topic", "Create"];
    }
    return ["Start", "Task Type", "Language", "Topic", "Level", "Create"];
  };

  const wizardSteps = getWizardSteps();
  const customFinalStep = 5;

  const goToStep = (nextStep) => {
    setPanelDirection(nextStep > wizardStep ? "forward" : "back");
    setWizardStep(nextStep);
  };

  const getPanelClass = (extra = "") => {
    const classes = [
      "wizard-panel",
      "wizard-panel-enter",
      `wizard-panel-enter-${panelDirection}`,
      extra,
    ].filter(Boolean);
    return classes.join(" ");
  };

  const selectAndGo = (nextStep, onSelect) => {
    if (isSelecting) return;
    setIsSelecting(true);
    onSelect?.();
    window.setTimeout(() => {
      goToStep(nextStep);
      setIsSelecting(false);
    }, 160);
  };

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

  const buildGeneratePayload = () => {
    if (useOwnTemplate === true) {
      return {
        language,
        concept,
        difficulty,
        template_id: null,
      };
    }
    return {
      template_id: Number(template),
      language: getLanguageFromTemplate(),
      concept: selectedTemplate?.concept || "General",
      difficulty: selectedTemplate?.difficulty || "Basic",
    };
  };

  const resetGenerationResults = () => {
    setTask("");
    setGeneratedData(null);
    setExerciseSeries(null);
    setActiveExerciseIndex(0);
    setSaved(false);
    setSeriesSaved(false);
    setTaskId(null);
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
    resetGenerationResults();

    try {
      const payload = buildGeneratePayload();
      const res = await tasksAPI.generate(payload);

      setGeneratedData(res.data);
      setTask(res.data.description);
      goToStep(useOwnTemplate ? customFinalStep : 2);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      let message;
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg || d).join(", ");
      } else {
        message = "Error generating task. Please check your API key and try again.";
      }
      alert(message);
      setTask(message);
    } finally {
      setLoading(false);
    }
  };

  const generateSeries = async () => {
    if (useOwnTemplate === true && (!language || !concept)) {
      alert("Please select Language and Concept.");
      return;
    }

    if (useOwnTemplate === false && !template) {
      alert("Please select a template.");
      return;
    }

    setLoading(true);
    resetGenerationResults();

    try {
      const base = buildGeneratePayload();
      const { difficulty, ...seriesPayload } = base;
      const res = await tasksAPI.generateSeries({
        ...seriesPayload,
        exercise_count: exerciseCount,
      });

      setExerciseSeries(res.data);
      setActiveExerciseIndex(0);
      setActiveTab("description");
      goToStep(useOwnTemplate ? customFinalStep : 2);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      let message;
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg || d).join(", ");
      } else {
        message = "Error generating exercise series. Please try again.";
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (generationMode === "series") {
      generateSeries();
    } else {
      generate();
    }
  };

  const getActiveExercise = () => {
    if (!exerciseSeries?.exercises?.length) return null;
    return exerciseSeries.exercises[activeExerciseIndex];
  };

  const getSeriesTunerContext = (exercise) => ({
    title: exercise?.title || "",
    language: exerciseSeries?.language || getDisplayLanguage(),
    concept: exerciseSeries?.concept || getDisplayConcept(),
    difficulty: exercise?.difficulty || "Basic",
    description: exercise?.description || "",
    examples: exercise?.examples || "",
    solution: exercise?.solution || "",
    tests: exercise?.tests || "",
  });

  const handleSeriesRefined = (field, content, updatedTests) => {
    setExerciseSeries((prev) => {
      const exercises = [...prev.exercises];
      const current = { ...exercises[activeExerciseIndex] };
      current[field] = content;
      if (field === "solution" && updatedTests) {
        current.tests = updatedTests;
      }
      exercises[activeExerciseIndex] = current;
      return { ...prev, exercises };
    });

    if (field === "solution" && updatedTests) {
      setActiveTab("tests");
    }

    setSeriesSaved(false);
  };

  const saveAllExercises = async () => {
    if (!exerciseSeries?.exercises?.length || isSavingSeries || seriesSaved) return;

    setIsSavingSeries(true);
    try {
      for (const ex of exerciseSeries.exercises) {
        await tasksAPI.create({
          title: ex.title,
          description: ex.description,
          language: exerciseSeries.language,
          concept: exerciseSeries.concept,
          difficulty: ex.difficulty,
          template_name: selectedTemplate?.name || exerciseSeries.series_title,
          examples: ex.examples,
          solution: ex.solution,
          tests: ex.tests,
        });
      }
      setSeriesSaved(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save exercise series.");
    } finally {
      setIsSavingSeries(false);
    }
  };

  const exportSeriesMarkdown = () => {
    if (!exerciseSeries?.exercises?.length) return;

    const parts = exerciseSeries.exercises.map((ex) => {
      return [
        `# ${ex.title}`,
        "",
        `**Difficulty:** ${ex.difficulty}`,
        "",
        ex.description,
        "",
        ex.examples ? `## Examples\n\n${ex.examples}` : "",
        ex.solution ? `## Reference Solution\n\n\`\`\`${exerciseSeries.language.toLowerCase()}\n${ex.solution}\n\`\`\`` : "",
        ex.tests ? `## Unit Tests\n\n\`\`\`${exerciseSeries.language.toLowerCase()}\n${ex.tests}\n\`\`\`` : "",
        "",
        "---",
        "",
      ].filter(Boolean).join("\n");
    });

    const md = `# ${exerciseSeries.series_title}\n\n${parts.join("\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exerciseSeries.concept.replace(/\s+/g, "_")}_Exercise_Series.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderProgressBreadcrumb = (items) => (
    <div className="wizard-breadcrumb wizard-breadcrumb-animated" aria-label="Your choices so far">
      {items.map((item, i) => (
        <span
          key={item.label}
          className="wizard-breadcrumb-item"
          style={{ "--stagger": i }}
        >
          {i > 0 && <span className="wizard-breadcrumb-sep">→</span>}
          <span className="wizard-breadcrumb-label">{item.label}:</span>
          <span className="wizard-breadcrumb-value">{item.value}</span>
        </span>
      ))}
    </div>
  );

  const renderGenerationModePicker = (advanceToStep) => (
    <div className="generation-mode-picker wizard-stagger">
      <button
        type="button"
        className={`generation-mode-card interactive-card ${generationMode === "single" ? "selected" : ""}`}
        style={{ "--stagger": 0 }}
        onClick={() => {
          setGenerationMode("single");
          setDifficulty("");
          if (advanceToStep != null) selectAndGo(advanceToStep);
        }}
      >
        <span className="generation-mode-icon">1</span>
        <span className="generation-mode-title">Single Exercise</span>
        <span className="generation-mode-desc">
          One standalone task — you pick how hard it should be
        </span>
        <span className="card-select-hint">Click to continue →</span>
      </button>
      <button
        type="button"
        className={`generation-mode-card interactive-card ${generationMode === "series" ? "selected" : ""}`}
        style={{ "--stagger": 1 }}
        onClick={() => {
          setGenerationMode("series");
          setDifficulty("");
          if (advanceToStep != null) selectAndGo(advanceToStep);
        }}
      >
        <span className="generation-mode-icon series">1→2→3</span>
        <span className="generation-mode-title">Exercise Series</span>
        <span className="generation-mode-desc">
          Multiple linked exercises that get harder step by step — no level pick needed
        </span>
        <span className="card-select-hint">Click to continue →</span>
      </button>
    </div>
  );

  const renderGenerateActions = (backStep, options = {}) => {
    const defaultButtonLabel = generationMode === "series"
      ? `Create ${exerciseCount} Exercises`
      : "Create Exercise";

    const buttonLabel = loading
      ? "Generating..."
      : options.buttonLabel || defaultButtonLabel;

    return (
      <div className="generate-actions-row wizard-stagger">
        <button
          className="btn-secondary interactive-btn"
          style={{ "--stagger": 0 }}
          onClick={() => goToStep(backStep)}
        >
          ← Back
        </button>
        <button
          className="btn-primary btn-generate-animated interactive-btn btn-shimmer"
          style={{ "--stagger": 1 }}
          onClick={handleGenerateClick}
          disabled={loading}
        >
          {buttonLabel}
        </button>
      </div>
    );
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

  const getSaveButtonText = () => {
    if (isSaving) return "Saving...";
    if (saved) return "Saved";
    return "Save to History";
  };

  const getSaveSeriesButtonText = () => {
    if (isSavingSeries) return "Saving...";
    if (seriesSaved) return "All Saved";
    return "Save All to History";
  };

  return (
    <div className={`page-content ${isSelecting ? "wizard-selecting" : ""}`}>
      <div className="wizard-progress">
        {wizardSteps.map((step, i) => (
          <div
            key={`${step}-${i}`}
            className={`wizard-step ${
              i === wizardStep ? "active" : ""
            } ${i < wizardStep ? "completed" : ""}`}
            style={{ "--stagger": i }}
          >
            <div className="wizard-circle">
              <span className="wizard-circle-inner">
                {i < wizardStep ? "✓" : i + 1}
              </span>
              {i === wizardStep && <span className="wizard-circle-ring" />}
            </div>
            <div className="wizard-label">{step}</div>
            {i < wizardSteps.length - 1 && (
              <div className={`wizard-line ${i < wizardStep ? "filled" : ""}`} />
            )}
          </div>
        ))}
      </div>

      {wizardStep === 0 && (
        <div className={getPanelClass()} key="step-0">
          <h2 className="wizard-heading">How do you want to start?</h2>
          <p className="wizard-subtitle">
            Pick a saved template or build a custom exercise from scratch — we&apos;ll guide you step by step.
          </p>

          <div className="template-mode-grid wizard-stagger">
            <button
              type="button"
              className={`template-mode-card interactive-card ${
                useOwnTemplate === false ? "selected" : ""
              }`}
              style={{ "--stagger": 0 }}
              onClick={() => {
                setUseOwnTemplate(false);
                setLanguage("");
                setConcept("");
                setDifficulty("");
                selectAndGo(1);
              }}
            >
              <div className="mode-icon-svg icon-float"><IconBook width={32} height={32} /></div>
              <div className="mode-title">From Template</div>
              <div className="mode-subtitle">
                Reuse a layout you already saved — fastest way to generate.
              </div>
              <span className="card-select-hint">Click to continue →</span>
            </button>

            <button
              type="button"
              className={`template-mode-card interactive-card ${
                useOwnTemplate === true ? "selected" : ""
              }`}
              style={{ "--stagger": 1 }}
              onClick={() => {
                setUseOwnTemplate(true);
                setTemplate("");
                setGenerationMode("single");
                setExerciseCount(3);
                setLanguage("");
                setConcept("");
                setDifficulty("");
                selectAndGo(1);
              }}
            >
              <div className="mode-icon-svg icon-float"><IconSpark width={32} height={32} /></div>
              <div className="mode-title">Custom Exercise</div>
              <div className="mode-subtitle">
                Start with one exercise or a full lesson series — you choose the topic.
              </div>
              <span className="card-select-hint">Click to continue →</span>
            </button>
          </div>
        </div>
      )}

      {wizardStep === 1 && useOwnTemplate === false && (
        <div className={getPanelClass()} key="step-tpl-1">
          <h2 className="wizard-heading">Pick a template</h2>
          <p className="wizard-subtitle">
            Templates store your preferred layout — language, topic, and level are already set.
          </p>

          <div className="templates-grid wizard-stagger">
            {templates.map((t, i) => (
              <button
                key={t.template_id}
                type="button"
                className={`template-card interactive-card ${
                  template === String(t.template_id) ? "selected" : ""
                }`}
                style={{ "--stagger": i }}
                onClick={() => selectAndGo(2, () => setTemplate(String(t.template_id)))}
              >
                <div className="template-name">{t.name}</div>
                <div className="template-desc">
                  {t.concept || t.difficulty || "Saved template"}
                </div>
                <span className="card-select-hint">Use this template →</span>
              </button>
            ))}
          </div>

          {templates.length === 0 && (
            <p className="no-content">No templates found.</p>
          )}

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(0)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 2 && useOwnTemplate === false && !generatedData && !exerciseSeries && (
        <div className={getPanelClass("wizard-panel-glow")} key="step-tpl-2">
          <h2 className="wizard-heading">Almost there — how many exercises?</h2>
          <p className="wizard-subtitle">
            One focused task, or a set that builds from easy to hard for a full lesson.
          </p>

          <div className="generation-summary wizard-summary-pop">
            <div className="summary-item">
              <span className="summary-label">Template:</span>
              <span className="summary-value">
                {selectedTemplate?.name || "None"}
              </span>
            </div>
          </div>

          {renderGenerationModePicker()}
          {renderGenerateActions(1)}
        </div>
      )}

      {wizardStep === 1 && useOwnTemplate === true && (
        <div className={getPanelClass()} key="step-custom-1">
          <h2 className="wizard-heading">One exercise or a full series?</h2>
          <p className="wizard-subtitle">
            A <strong>single exercise</strong> is great for homework or a quick quiz.
            An <strong>exercise series</strong> creates a mini-lesson that ramps up difficulty automatically.
          </p>

          {renderProgressBreadcrumb([{ label: "Path", value: "Custom exercise" }])}

          {renderGenerationModePicker(2)}

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(0)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 2 && useOwnTemplate === true && generationMode === "series" && (
        <div className={getPanelClass()} key="step-custom-series-count">
          <h2 className="wizard-heading">How many exercises in the series?</h2>
          <p className="wizard-subtitle">
            Each exercise builds on the last. Difficulty increases on its own — from easier to harder.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Exercise series" },
          ])}

          <div className="exercise-count-grid wizard-stagger">
            {exerciseCountOptions.map((opt, i) => (
              <button
                key={opt.count}
                type="button"
                className={`exercise-count-card interactive-card ${exerciseCount === opt.count ? "selected" : ""}`}
                style={{ "--stagger": i }}
                onClick={() => selectAndGo(3, () => setExerciseCount(opt.count))}
              >
                <span className="exercise-count-number">{opt.count}</span>
                <span className="exercise-count-label">{opt.label}</span>
                <span className="exercise-count-desc">{opt.desc}</span>
                <span className="exercise-count-preview">
                  {seriesDifficultyPreview(opt.count).join(" → ")}
                </span>
                <span className="card-select-hint">Select →</span>
              </button>
            ))}
          </div>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(1)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 2 && useOwnTemplate === true && generationMode === "single" && (
        <div className={getPanelClass()} key="step-custom-single-lang">
          <h2 className="wizard-heading">Which programming language?</h2>
          <p className="wizard-subtitle">
            This sets the syntax for the exercise, examples, solution, and tests.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Single exercise" },
          ])}

          <div className="language-grid wizard-stagger">
            <button
              type="button"
              className={`language-card interactive-card ${language === "Python" ? "selected" : ""}`}
              style={{ "--stagger": 0 }}
              onClick={() => selectAndGo(3, () => setLanguage("Python"))}
            >
              <div className="language-icon-svg icon-float"><IconPython width={36} height={36} /></div>
              <div className="language-name">Python</div>
              <div className="language-hint">Readable and great for beginners</div>
              <span className="card-select-hint">Choose Python →</span>
            </button>

            <button
              type="button"
              className={`language-card interactive-card ${language === "Java" ? "selected" : ""}`}
              style={{ "--stagger": 1 }}
              onClick={() => selectAndGo(3, () => setLanguage("Java"))}
            >
              <div className="language-icon-svg icon-float"><IconJava width={36} height={36} /></div>
              <div className="language-name">Java</div>
              <div className="language-hint">Structured and widely used in courses</div>
              <span className="card-select-hint">Choose Java →</span>
            </button>
          </div>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(1)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 3 && useOwnTemplate === true && generationMode === "series" && (
        <div className={getPanelClass()} key="step-custom-series-lang">
          <h2 className="wizard-heading">Which programming language?</h2>
          <p className="wizard-subtitle">
            All {exerciseCount} exercises in this series will use the same language.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Exercise series" },
            { label: "Count", value: `${exerciseCount} exercises` },
          ])}

          <div className="language-grid wizard-stagger">
            <button
              type="button"
              className={`language-card interactive-card ${language === "Python" ? "selected" : ""}`}
              style={{ "--stagger": 0 }}
              onClick={() => selectAndGo(4, () => setLanguage("Python"))}
            >
              <div className="language-icon-svg icon-float"><IconPython width={36} height={36} /></div>
              <div className="language-name">Python</div>
              <div className="language-hint">Readable and great for beginners</div>
              <span className="card-select-hint">Choose Python →</span>
            </button>

            <button
              type="button"
              className={`language-card interactive-card ${language === "Java" ? "selected" : ""}`}
              style={{ "--stagger": 1 }}
              onClick={() => selectAndGo(4, () => setLanguage("Java"))}
            >
              <div className="language-icon-svg icon-float"><IconJava width={36} height={36} /></div>
              <div className="language-name">Java</div>
              <div className="language-hint">Structured and widely used in courses</div>
              <span className="card-select-hint">Choose Java →</span>
            </button>
          </div>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(2)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 3 && useOwnTemplate === true && generationMode === "single" && (
        <div className={getPanelClass()} key="step-custom-single-topic">
          <h2 className="wizard-heading">What topic should students practice?</h2>
          <p className="wizard-subtitle">
            Pick the programming concept this exercise should focus on.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Single exercise" },
            { label: "Language", value: language },
          ])}

          <div className="concepts-grid concepts-grid-detailed wizard-stagger">
            {quickConcepts.map((item, i) => (
              <button
                key={item}
                type="button"
                className={`concept-card interactive-card ${concept === item ? "active" : ""}`}
                style={{ "--stagger": i }}
                onClick={() => selectAndGo(4, () => setConcept(item))}
              >
                <span className="concept-card-title">{item}</span>
                <span className="concept-card-desc">{conceptInfo[item]}</span>
                <span className="card-select-hint">Pick topic →</span>
              </button>
            ))}
          </div>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(2)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 4 && useOwnTemplate === true && generationMode === "series" && (
        <div className={getPanelClass()} key="step-custom-series-topic">
          <h2 className="wizard-heading">What topic ties the series together?</h2>
          <p className="wizard-subtitle">
            Every exercise will teach the same concept — each one just gets a bit harder.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Exercise series" },
            { label: "Count", value: `${exerciseCount} exercises` },
            { label: "Language", value: language },
          ])}

          <div className="concepts-grid concepts-grid-detailed wizard-stagger">
            {quickConcepts.map((item, i) => (
              <button
                key={item}
                type="button"
                className={`concept-card interactive-card ${concept === item ? "active" : ""}`}
                style={{ "--stagger": i }}
                onClick={() => selectAndGo(5, () => setConcept(item))}
              >
                <span className="concept-card-title">{item}</span>
                <span className="concept-card-desc">{conceptInfo[item]}</span>
                <span className="card-select-hint">Pick topic →</span>
              </button>
            ))}
          </div>

          <p className="wizard-hint wizard-hint-pulse">
            Difficulty is automatic: {seriesDifficultyPreview(exerciseCount).join(" → ")}
          </p>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(3)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 4 && useOwnTemplate === true && generationMode === "single" && (
        <div className={getPanelClass()} key="step-custom-single-level">
          <h2 className="wizard-heading">How challenging should it be?</h2>
          <p className="wizard-subtitle">
            Match the level to your students — you can always regenerate if it feels off.
          </p>

          {renderProgressBreadcrumb([
            { label: "Type", value: "Single exercise" },
            { label: "Language", value: language },
            { label: "Topic", value: concept },
          ])}

          <div className="difficulty-grid wizard-stagger">
            {["Basic", "Intermediate", "Advanced"].map((level, i) => (
              <button
                key={level}
                type="button"
                className={`difficulty-card interactive-card difficulty-${level.toLowerCase()} ${difficulty === level ? "active" : ""}`}
                style={{ "--stagger": i }}
                onClick={() => selectAndGo(5, () => setDifficulty(level))}
              >
                <div className="difficulty-dot" />
                <div className="difficulty-name">{level}</div>
                <div className="difficulty-desc">{difficultyInfo[level]}</div>
                <span className="card-select-hint">Set level →</span>
              </button>
            ))}
          </div>

          <button className="btn-secondary interactive-btn" onClick={() => goToStep(3)}>
            ← Back
          </button>
        </div>
      )}

      {wizardStep === 5 && useOwnTemplate === true && !generatedData && !exerciseSeries && (
        <div className={getPanelClass("wizard-panel-glow")} key="step-custom-final">
          <h2 className="wizard-heading">Ready to create your exercise{generationMode === "series" ? " series" : ""}</h2>
          <p className="wizard-subtitle">
            {generationMode === "series"
              ? "Check your choices below, then let the AI build your progressive lesson."
              : "Everything looks good — hit create when you are ready."}
          </p>

          <div className="generation-summary wizard-summary-pop">
            <div className="summary-item">
              <span className="summary-label">Type:</span>
              <span className="summary-value">
                {generationMode === "series" ? "Exercise series" : "Single exercise"}
              </span>
            </div>

            {generationMode === "series" && (
              <div className="summary-item">
                <span className="summary-label">Exercises:</span>
                <span className="summary-value">{exerciseCount}</span>
              </div>
            )}

            <div className="summary-item">
              <span className="summary-label">Language:</span>
              <span className="summary-value">{language}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Topic:</span>
              <span className="summary-value">{concept}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Difficulty:</span>
              <span className="summary-value">
                {generationMode === "series"
                  ? `Auto: ${seriesDifficultyPreview(exerciseCount).join(" → ")}`
                  : difficulty}
              </span>
            </div>
          </div>

          {renderGenerateActions(4)}
        </div>
      )}

      {generatedData && (
        <div className="result-card result-card-animated">
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
              Happy with the result? Save it, run tests, or use the magic wand to adjust any section.
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
              {getSaveButtonText()}
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

      {exerciseSeries && (
        <div className="result-card exercise-series-card">
          <div className="result-header">
            <div className="result-meta">
              <span className="language-badge">{exerciseSeries.language}</span>
              <span className="concept-badge">{exerciseSeries.concept}</span>
              <span className="series-badge">Exercise Series</span>
            </div>
            <h3>{exerciseSeries.series_title}</h3>
            <p className="prompt-tuner-intro">
              {exerciseSeries.exercises.length} linked exercises for a full lesson — start with Exercise 1 and work your way up. Use the magic wand to tweak any section.
            </p>
          </div>

          <div className="exercise-series-tabs">
            {exerciseSeries.exercises.map((ex, i) => (
              <button
                key={ex.exercise_number}
                type="button"
                className={`exercise-tab ${activeExerciseIndex === i ? "active" : ""}`}
                onClick={() => {
                  setActiveExerciseIndex(i);
                  setActiveTab("description");
                }}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="exercise-tab-num">{ex.exercise_number}</span>
                <span className="exercise-tab-label">Exercise {ex.exercise_number}</span>
                <span
                  className="exercise-tab-diff"
                  style={{ color: getDifficultyColor(ex.difficulty) }}
                >
                  {ex.difficulty}
                </span>
              </button>
            ))}
          </div>

          {(() => {
            const exercise = getActiveExercise();
            if (!exercise) return null;
            const ctx = getSeriesTunerContext(exercise);

            return (
              <>
                <h4 className="exercise-active-title">{exercise.title}</h4>

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

                <div className="tab-content tab-content-animated">
                  {activeTab === "description" && (
                    <div className="description-tab">
                      <PromptTuner
                        field="description"
                        content={exercise.description}
                        context={ctx}
                        onRefined={handleSeriesRefined}
                      >
                        <div className="task-description">
                          <p>{exercise.description}</p>
                        </div>
                      </PromptTuner>
                      {exercise.examples && (
                        <PromptTuner
                          field="examples"
                          content={exercise.examples}
                          context={ctx}
                          onRefined={handleSeriesRefined}
                          codeBlock
                        >
                          <pre className="example-pre">{exercise.examples}</pre>
                        </PromptTuner>
                      )}
                    </div>
                  )}

                  {activeTab === "solution" && exercise.solution && (
                    <div className="solution-tab">
                      <PromptTuner
                        field="solution"
                        content={exercise.solution}
                        context={ctx}
                        onRefined={handleSeriesRefined}
                        codeBlock
                      >
                        <div className="code-header">
                          <span className="code-language">{exerciseSeries.language} Solution</span>
                          <button
                            className="btn-copy"
                            onClick={() => navigator.clipboard.writeText(exercise.solution)}
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre className="code-block"><code>{exercise.solution}</code></pre>
                      </PromptTuner>
                    </div>
                  )}

                  {activeTab === "tests" && exercise.tests && (
                    <div className="tests-tab">
                      <PromptTuner
                        field="tests"
                        content={exercise.tests}
                        context={ctx}
                        onRefined={handleSeriesRefined}
                        codeBlock
                      >
                        <div className="code-header">
                          <span className="code-language">Test Cases</span>
                          <button
                            className="btn-copy"
                            onClick={() => navigator.clipboard.writeText(exercise.tests)}
                          >
                            Copy Tests
                          </button>
                        </div>
                        <pre className="code-block"><code>{exercise.tests}</code></pre>
                      </PromptTuner>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          <div className="result-actions">
            <button
              className="btn-secondary"
              onClick={saveAllExercises}
              disabled={seriesSaved || isSavingSeries}
            >
              {getSaveSeriesButtonText()}
            </button>
            <button className="btn-secondary" onClick={exportSeriesMarkdown}>
              Export Series (.md)
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
            <h3>{generationMode === "series" ? "Building your exercise series" : "Creating your exercise"}</h3>
            <p className="generate-loading-wait">
              {generationMode === "series"
                ? `Please wait 30–60 seconds for ${exerciseCount} exercises`
                : "Please wait 10–20 seconds"}
            </p>
            <p className="generate-loading-step">
              {(generationMode === "series" ? getSeriesLoadingMessages(exerciseCount) : loadingMessages)[loadingStep]}
            </p>
            {generationMode === "series" && (
              <div className="series-loading-steps">
                {Array.from({ length: exerciseCount }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className={`series-loading-dot ${loadingStep >= n - 1 ? "active" : ""}`}
                  >
                    Ex {n}
                  </span>
                ))}
              </div>
            )}
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