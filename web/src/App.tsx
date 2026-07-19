import { useState, useEffect, useCallback } from "react";
import Shell from "./components/Shell";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
}

const STORAGE_KEY = "todoapp_todos";

const priorityColors: Record<Priority, string> = {
  low: "var(--accent)",
  medium: "#f59e0b",
  high: "#ef4444",
};

const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      priority,
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
    setDueDate("");
    setPriority("medium");
    setShowForm(false);
  }, [input, priority, dueDate]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editText.trim()) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingId ? { ...t, text: editText.trim() } : t
      )
    );
    setEditingId(null);
    setEditText("");
  }, [editingId, editText]);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, []);

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const navItems = [
    {
      id: "all",
      label: "All Tasks",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: () => setFilter("all"),
      active: filter === "all",
    },
    {
      id: "active",
      label: "Active",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        </svg>
      ),
      onClick: () => setFilter("active"),
      active: filter === "active",
    },
    {
      id: "completed",
      label: "Completed",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setFilter("completed"),
      active: filter === "completed",
    },
  ];

  return (
    <Shell
      appName="To-Do"
      navItems={navItems}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-1"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            My Tasks
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {activeCount} remaining · {completedCount} done
          </p>
        </div>

        {/* Add Task Button / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 px-5 py-4 mb-6 text-left transition-all"
            style={{
              background: "var(--panel)",
              border: "2px dashed var(--line)",
              borderRadius: "1.25rem",
              color: "var(--muted)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add a new task…
          </button>
        ) : (
          <div
            className="mb-6 p-5"
            style={{
              background: "var(--panel)",
              border: "1.5px solid var(--line)",
              borderRadius: "1.25rem",
            }}
          >
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="What do you need to do?"
              className="w-full bg-transparent outline-none text-base mb-4"
              style={{
                color: "var(--ink)",
                fontFamily: "Manrope, sans-serif",
                fontSize: "1rem",
              }}
            />
            <div className="flex flex-wrap gap-3 items-center">
              {/* Priority */}
              <div className="flex gap-1">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="px-3 py-1 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: "0.75rem",
                      background:
                        priority === p ? priorityColors[p] : "var(--paper)",
                      color: priority === p ? "#fff" : "var(--muted)",
                      border: `1.5px solid ${priority === p ? priorityColors[p] : "var(--line)"}`,
                    }}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>

              {/* Due date */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent outline-none text-xs px-3 py-1"
                style={{
                  color: "var(--muted)",
                  border: "1.5px solid var(--line)",
                  borderRadius: "0.75rem",
                  fontFamily: "Manrope, sans-serif",
                }}
              />

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setInput("");
                    setDueDate("");
                    setPriority("medium");
                  }}
                  className="px-4 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    borderRadius: "0.75rem",
                    background: "var(--paper)",
                    color: "var(--muted)",
                    border: "1.5px solid var(--line)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addTodo}
                  disabled={!input.trim()}
                  className="px-4 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    borderRadius: "0.75rem",
                    background: input.trim() ? "var(--accent)" : "var(--line)",
                    color: input.trim() ? "#fff" : "var(--muted)",
                    border: "none",
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 text-sm font-semibold capitalize transition-all"
              style={{
                borderRadius: "0.75rem",
                background: filter === f ? "var(--accent)" : "var(--panel)",
                color: filter === f ? "#fff" : "var(--muted)",
                border: "1.5px solid var(--line)",
              }}
            >
              {f}
            </button>
          ))}
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="ml-auto px-4 py-1.5 text-sm font-semibold transition-all"
              style={{
                borderRadius: "0.75rem",
                background: "transparent",
                color: "#ef4444",
                border: "1.5px solid #ef444440",
              }}
            >
              Clear done
            </button>
          )}
        </div>

        {/* Todo List */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            style={{ color: "var(--muted)" }}
          >
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="mb-4 opacity-30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
              {filter === "completed" ? "No completed tasks yet" : filter === "active" ? "Nothing active!" : "All clear!"}
            </p>
            <p className="text-sm">
              {filter === "all" ? "Add your first task above to get started." : ""}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((todo) => (
              <li
                key={todo.id}
                className="flex items-start gap-4 px-5 py-4 group transition-all"
                style={{
                  background: "var(--panel)",
                  border: "1.5px solid var(--line)",
                  borderRadius: "1.25rem",
                  opacity: todo.completed ? 0.65 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: todo.completed ? "var(--accent)" : priorityColors[todo.priority],
                    background: todo.completed ? "var(--accent)" : "transparent",
                  }}
                  aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {todo.completed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={saveEdit}
                      className="w-full bg-transparent outline-none text-sm font-semibold"
                      style={{ color: "var(--ink)", fontFamily: "Manrope, sans-serif" }}
                    />
                  ) : (
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{
                        color: "var(--ink)",
                        textDecoration: todo.completed ? "line-through" : "none",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {todo.text}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Priority badge */}
                    <span
                      className="text-xs font-semibold px-2 py-0.5"
                      style={{
                        borderRadius: "0.5rem",
                        background: priorityColors[todo.priority] + "22",
                        color: priorityColors[todo.priority],
                      }}
                    >
                      {priorityLabels[todo.priority]}
                    </span>
                    {/* Due date */}
                    {todo.dueDate && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        📅 {new Date(todo.dueDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => startEdit(todo)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ color: "var(--muted)", background: "var(--paper)" }}
                    aria-label="Edit"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ color: "#ef4444", background: "#ef444415" }}
                    aria-label="Delete"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Progress bar */}
        {todos.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span>Progress</span>
              <span>{Math.round((completedCount / todos.length) * 100)}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "var(--line)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / todos.length) * 100}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
