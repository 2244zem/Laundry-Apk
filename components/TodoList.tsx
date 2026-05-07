"use client";

import React, { useState, useEffect } from "react";
import { TodoItem } from "@/lib/types";
import { getTodos, saveTodos, generateId } from "@/lib/storage";

const PRIO = {
  high: { label: "Urgent", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  medium: { label: "Normal", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  low: { label: "Rendah", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

export default function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<"low"|"medium"|"high">("medium");
  const [filter, setFilter] = useState<"all"|"active"|"completed">("all");

  useEffect(() => { setTodos(getTodos()); }, []);
  useEffect(() => { if (todos.length > 0 || getTodos().length > 0) saveTodos(todos); }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [{ id: generateId(), text: newTodo.trim(), completed: false, priority: newPriority, createdAt: new Date().toISOString() }, ...prev]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  const deleteTodo = (id: string) => setTodos(prev => prev.filter(t => t.id !== id));

  const filtered = todos.filter(t => filter === "active" ? !t.completed : filter === "completed" ? t.completed : true);
  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center"><p className="text-xl font-bold text-primary-700">{todos.length}</p><p className="text-xs text-gray-500 mt-0.5">Total</p></div>
        <div className="card p-4 text-center"><p className="text-xl font-bold text-yellow-600">{activeCount}</p><p className="text-xs text-gray-500 mt-0.5">Aktif</p></div>
        <div className="card p-4 text-center"><p className="text-xl font-bold text-green-600">{completedCount}</p><p className="text-xs text-gray-500 mt-0.5">Selesai</p></div>
      </div>

      {/* Add */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tambah Tugas</h3>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input type="text" placeholder="Tulis tugas baru..." value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()} className="input-field flex-1 min-w-0" />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="input-field w-28">
            <option value="high">Urgent</option>
            <option value="medium">Normal</option>
            <option value="low">Rendah</option>
          </select>
          <button onClick={addTodo} className="btn-primary whitespace-nowrap">Tambah</button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all","active","completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter===f?"active":""}`}>
            {f==="all"?"Semua":f==="active"?"Aktif":"Selesai"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card-muted p-8 text-center">
            <p className="text-sm text-gray-400">{filter==="completed"?"Belum ada tugas selesai":"Tidak ada tugas"}</p>
          </div>
        )}
        {filtered.map(todo => {
          const p = PRIO[todo.priority];
          return (
            <div key={todo.id} className={`card p-4 flex items-center gap-3 group ${todo.completed?"opacity-50":""}`}>
              <button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${todo.completed?"bg-primary-600 border-primary-600 text-white":"border-gray-300 hover:border-primary-400"}`}>
                {todo.completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${todo.completed?"line-through text-gray-400":"text-gray-800"}`}>{todo.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(todo.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.bg} ${p.color}`}>{p.label}</span>
              <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
