import { useState, useRef, useEffect } from "react";
import { chatAPI } from "../api/client";

export default function AIWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your AI teaching assistant. I can help you craft templates, learning goals, or generate tasks. Ask me anything about creating programming exercises!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
              <div className="ai-msg-sender">{m.role === 'assistant' ? '🤖 AI Assistant' : '👤 You'}</div>
              <div className="ai-msg-text">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="ai-msg bot">
              <div className="ai-msg-sender">🤖 AI Assistant</div>
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
            placeholder="Ask about templates, tasks, or teaching ideas..."
            disabled={loading}
          />
          <button className="ai-send" onClick={send} disabled={!input.trim() || loading}>
            {loading ? "..." : "➤"}
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


