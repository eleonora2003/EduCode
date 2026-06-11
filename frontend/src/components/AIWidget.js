import { useState, useRef, useEffect } from "react";
import { chatAPI } from "../api/client";

export default function AIWidget({ showAI, setShowAI, onTemplateGenerated }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I can help you create templates. Try: \"Generate a Python template for loops\" and I'll fill and save it for you."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Default to internal state if props not provided
  const [internalOpen, setInternalOpen] = useState(false);
  const open = showAI !== undefined ? showAI : internalOpen;
  const setOpen = setShowAI || setInternalOpen;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const newMessage = { role: "user", text };
    const nextMessages = [...messages, newMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await chatAPI.send(
        nextMessages.map((msg) => ({ role: msg.role, content: msg.text }))
      );

      const reply = res.data?.reply || "No response from AI.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);

      if (res.data?.template && onTemplateGenerated) {
        onTemplateGenerated(res.data.template);
      }
    } catch (err) {
      const errorText = err?.response?.data?.detail || err.message || "AI service error.";
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${errorText}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={`ai-widget ${open ? "open" : ""}`}>
        <div className="ai-header">
          <strong>EduCode Assistant</strong>
          <button className="ai-close" onClick={() => setOpen(false)}>Close</button>
        </div>

        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role === 'assistant' ? 'bot' : 'user'}`}>
              <div className="ai-msg-sender">{m.role === 'assistant' ? 'AI Assistant' : 'You'}</div>
              <div className="ai-msg-text">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="ai-msg bot">
              <div className="ai-msg-sender">AI Assistant</div>
              <div className="ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI assistant about templates, tasks, or teaching guidance..."
            disabled={loading}
          />
          <button className="ai-send" onClick={send} disabled={!input.trim() || loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <button className="ai-fab" onClick={() => setOpen((v) => !v)} aria-label="Open AI assistant">
        AI
        <span className="ai-dot" />
      </button>
    </div>
  );
}


