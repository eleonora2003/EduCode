import { useState } from "react";
import API from "./api/client";
import "./styles.css";

export default function App() {
  const [language, setLanguage] = useState("Python");
  const [concept, setConcept] = useState("Loops");
  const [difficulty, setDifficulty] = useState("Easy");

  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  const loadTasks = async () => {
    const res = await API.get("/tasks");
    setTasks(res.data);
  };

  const generate = async () => {
    setLoading(true);
    setTask("");

    try {
      const res = await API.post("/task", {
        language,
        concept,
        difficulty
      });

      setTask(res.data.description);
    } catch (err) {
      console.error(err);
      setTask("Error generating task.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI Programming Task Generator</h1>

      <div className="card">

        <label>Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>Python</option>
          <option>Java</option>
        </select>

        <label>Concept</label>
        <select value={concept} onChange={(e) => setConcept(e.target.value)}>
          <option>Loops</option>
          <option>Arrays</option>
          <option>OOP</option>
          <option>Functions</option>
        </select>

        <label>Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <button onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate Task"}
        </button>
      </div>

      <div className="result">
        <h2>Generated Task</h2>
        <pre>{task}</pre>
      </div>

      <button onClick={loadTasks}>
        Show Saved Tasks
      </button>

      <ul>
        {tasks.map((t) => (
          <li key={t.task_id}>
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}