import { useState, useEffect, useRef, useMemo } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Go to Dashboard", shortcut: "Ctrl+D", icon: "home" },
  { id: "generate", label: "Generate Task", shortcut: "Ctrl+G", icon: "generate" },
  { id: "templates", label: "Create Template", shortcut: "Ctrl+W", icon: "templates" },
  { id: "validation", label: "Validate Tasks", shortcut: "Ctrl+V", icon: "validation" },
  { id: "export", label: "Export Tasks", shortcut: "Ctrl+E", icon: "export" },
  { id: "history", label: "Task History", shortcut: "Ctrl+Y", icon: "history" },
  { id: "ai", label: "Open AI Assistant", shortcut: "Ctrl+A", icon: "ai" },
];

function PaletteIcon({ type }) {
  const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (type) {
    case "home":
      return <svg {...props}><path d="M3 10a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M12 7V3.5L4 10h16L12 7Z" /></svg>;
    case "generate":
      return <svg {...props}><path d="M5 21h14a1 1 0 0 0 1-1v-11a1 1 0 0 0-.293-.707l-6-6A1 1 0 0 0 13 2H6a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1Z" /><path d="M13 2v5h5" /><path d="M8.5 12.5 15.5 5.5" /></svg>;
    case "templates":
      return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /><path d="M8 7v10" /></svg>;
    case "validation":
      return <svg {...props}><path d="M12 21c4.97 0 9-4.03 9-9V5.5L12 2 3 5.5V12c0 4.97 4.03 9 9 9Z" /><path d="m9.5 12.5 2 2 4-4" /></svg>;
    case "export":
      return <svg {...props}><path d="M12 3v13" /><path d="m8 9 4-4 4 4" /><path d="M5 21h14" /></svg>;
    case "history":
      return <svg {...props}><path d="M12 6v6l4 2" /><path d="M21 12A9 9 0 1 1 12 3a9 9 0 0 1 9 9Z" /></svg>;
    case "ai":
      return <svg {...props}><rect x="5" y="8" width="14" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" /><path d="M9.5 16.5h5" /></svg>;
    default:
      return null;
  }
}

export default function CommandPalette({ open, onClose, onNavigate, onOpenAI }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runAction = (item) => {
    onClose();
    if (item.id === "ai") {
      onOpenAI?.();
    } else {
      onNavigate?.(item.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      runAction(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  const handleOverlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <button
      type="button"
      className="cmd-palette-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      aria-label="Close command palette"
    >
      <dialog
        open
        className="cmd-palette"
        aria-label="Command palette"
      >
        <div>
        <div className="cmd-palette-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          <kbd className="cmd-kbd">Esc</kbd>
        </div>

        <ul className="cmd-palette-list">
          {filtered.length === 0 ? (
            <li className="cmd-palette-empty">No commands found</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`cmd-palette-item ${i === activeIndex ? "active" : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => runAction(item)}
                >
                  <span className="cmd-palette-icon"><PaletteIcon type={item.icon} /></span>
                  <span className="cmd-palette-label">{item.label}</span>
                  <kbd className="cmd-kbd">{item.shortcut}</kbd>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="cmd-palette-footer">
          <span><kbd className="cmd-kbd">↑↓</kbd> navigate</span>
          <span><kbd className="cmd-kbd">Enter</kbd> select</span>
          <span><kbd className="cmd-kbd">Ctrl+K</kbd> toggle</span>
        </div>
        </div>
      </dialog>
    </button>
  );
}

export function useCommandShortcuts({ onNavigate, onOpenAI, onTogglePalette }) {
  useEffect(() => {
    const isEditable = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      if (isEditable(e.target)) return;

      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (key === "k") {
        e.preventDefault();
        onTogglePalette?.();
        return;
      }

      const shortcuts = {
        w: () => onNavigate?.("templates"),
        g: () => onNavigate?.("generate"),
        a: () => onOpenAI?.(),
        d: () => onNavigate?.("dashboard"),
        v: () => onNavigate?.("validation"),
        e: () => onNavigate?.("export"),
        y: () => onNavigate?.("history"),
      };

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavigate, onOpenAI, onTogglePalette]);
}
