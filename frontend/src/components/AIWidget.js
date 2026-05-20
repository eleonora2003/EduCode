import { useState } from "react";
import API from "../api/client";

export default function AIWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your AI teaching assistant. I can help you craft templates, learning goals, or generate tasks."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post("/chat", {
        messages: nextMessages.map((msg) => ({ role: msg.role, content: msg.text }))
      });

      const reply = res.data?.reply || "No response from AI.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
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
          <strong>AI Teaching Assistant</strong>
          <button className="ai-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role === 'assistant' ? 'bot' : 'user'}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="ai-msg bot">...</div>}
        </div>

        <div className="ai-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about teaching..."
          />
          <button className="ai-send" onClick={send} disabled={!input.trim() || loading}>
            ➤
          </button>
        </div>
      </div>

      <button className="ai-fab" onClick={() => setOpen((v) => !v)} aria-label="Open AI assistant">
        🤖
        <span className="ai-dot" />
      </button>
    </div>
  );
}


