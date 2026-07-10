import { useState, useRef, useEffect } from "react";
import { tasksAPI } from "../api/client";
import { IconWand, IconClose } from "./icons";

const FIELD_LABELS = {
  description: "Task Description",
  examples: "Examples",
  solution: "Reference Solution",
  tests: "Unit Tests",
};

const PROMPT_HINTS = {
  description: [
    "Make this part more fun — include a Star Wars theme",
    "Simplify the language for beginners",
    "Add a real-world scenario about online shopping",
  ],
  examples: [
    "Add one more edge-case example",
    "Use smaller numbers that are easier to trace by hand",
  ],
  solution: [
    "Rewrite without a while loop — use a for loop instead",
    "Add clearer comments explaining each step",
    "Use a dictionary instead of nested if statements",
  ],
  tests: [
    "Add a test for empty input",
    "Include one test that checks error handling",
  ],
};

export default function PromptTuner({
  field,
  content,
  context,
  onRefined,
  children,
  codeBlock = false,
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef(null);
  const modalRef = useRef(null);

  const captureSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      setSelectedText(text);
    }
  };

  const openTuner = () => {
    captureSelection();
    setError("");
    setOpen(true);
  };

  const closeTuner = () => {
    if (loading) return;
    setOpen(false);
    setInstruction("");
    setSelectedText("");
    setError("");
  };

  const applyHint = (hint) => {
    setInstruction(hint);
  };

  const handleRefine = async () => {
    if (!instruction.trim()) {
      setError("Describe how you want this section changed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await tasksAPI.refine({
        field,
        instruction: instruction.trim(),
        content: content || "",
        selected_text: selectedText || null,
        context,
      });

      onRefined(field, res.data.content, res.data.tests);
      closeTuner();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not refine this section. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (open && e.key === "Escape") {
        closeTuner();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Focus the textarea when modal opens
  useEffect(() => {
    if (open && modalRef.current) {
      const textarea = modalRef.current.querySelector("textarea");
      if (textarea) {
        textarea.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      if (!contentRef.current?.contains(selection.anchorNode)) return;

      const text = selection.toString().trim();
      if (text) {
        setSelectedText(text);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeTuner();
    }
  };

  return (
    <div className="prompt-tuner-section">
      <div className="prompt-tuner-header">
        <span className="prompt-tuner-label">{FIELD_LABELS[field]}</span>
        <button
          type="button"
          className="prompt-tuner-wand"
          onClick={openTuner}
          title="Fine-tune with AI (select text first, or tune the whole section)"
          aria-label={`Fine-tune ${FIELD_LABELS[field]}`}
        >
          <IconWand width={18} height={18} />
          <span>Prompt Tuner</span>
        </button>
      </div>

      <section
        ref={contentRef}
        className={`prompt-tuner-content${codeBlock ? " prompt-tuner-code" : ""}`}
        aria-label={`${FIELD_LABELS[field]} content area`}
      >
        {children}
      </section>

      {open && (
        <div
          className="prompt-tuner-overlay"
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeTuner();
          }}
          aria-hidden="true"
        >
          <dialog
            ref={modalRef}
            className="prompt-tuner-modal"
            open
            aria-labelledby="prompt-tuner-title"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="prompt-tuner-modal-header">
              <div>
                <h4 id="prompt-tuner-title">Prompt Tuner</h4>
                <p className="prompt-tuner-subtitle">
                  You stay in control — tell the AI exactly what to change.
                </p>
              </div>
              <button
                type="button"
                className="prompt-tuner-close"
                onClick={closeTuner}
                aria-label="Close"
              >
                <IconClose width={18} height={18} />
              </button>
            </div>

            <div className="prompt-tuner-selection">
              <span className="prompt-tuner-selection-label">Target</span>
              {selectedText ? (
                <blockquote className="prompt-tuner-quote">
                  {selectedText.length > 220
                    ? `${selectedText.slice(0, 220)}…`
                    : selectedText}
                </blockquote>
              ) : (
                <p className="prompt-tuner-whole">
                  Entire {FIELD_LABELS[field].toLowerCase()} — or select text
                  in the section first, then open the tuner again.
                </p>
              )}
            </div>

            <label className="prompt-tuner-field-label" htmlFor={`tuner-${field}`}>
              Your instruction
            </label>
            <textarea
              id={`tuner-${field}`}
              className="prompt-tuner-input"
              rows={4}
              placeholder='e.g. "Make this more fun with a Star Wars theme" or "Use a for loop instead of while"'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={loading}
            />

            <div className="prompt-tuner-hints">
              <span>Try:</span>
              {(PROMPT_HINTS[field] || []).map((hint) => (
                <button
                  key={hint}
                  type="button"
                  className="prompt-tuner-hint"
                  onClick={() => applyHint(hint)}
                  disabled={loading}
                >
                  {hint}
                </button>
              ))}
            </div>

            {field === "solution" && (
              <p className="prompt-tuner-note">
                When you change the solution, unit tests are regenerated
                automatically to match the new code.
              </p>
            )}

            {error && <p className="prompt-tuner-error">{error}</p>}

            <div className="prompt-tuner-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeTuner}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary prompt-tuner-apply"
                onClick={handleRefine}
                disabled={loading}
              >
                {loading ? "Regenerating…" : "Apply changes"}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}