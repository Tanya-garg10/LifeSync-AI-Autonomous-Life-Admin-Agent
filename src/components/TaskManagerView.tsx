import React, { useState } from "react";
import { Task } from "../types.js";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Calendar, AlertCircle, Search, Filter } from "lucide-react";

interface TaskManagerViewProps {
  tasks: Task[];
  onAddTask: (title: string, priority: 'high' | 'medium' | 'low', deadline?: string, description?: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskManagerView({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TaskManagerViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>("all");
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>("medium");

  // Editing task state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>("medium");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle, newPriority, newDeadline || undefined, newDesc || undefined);
    setNewTitle("");
    setNewDesc("");
    setNewDeadline("");
    setNewPriority("medium");
    setIsAdding(false);
  };

  const handleStartEdit = (t: Task) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDesc(t.description || "");
    setEditDeadline(t.deadline || "");
    setEditPriority(t.priority);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    onUpdateTask(editingId, {
      title: editTitle,
      description: editDesc,
      deadline: editDeadline || undefined,
      priority: editPriority,
    });
    setEditingId(null);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white">Task Admin Manager</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage, prioritize, and orchestrate all your lifelog tasks.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Task
        </button>
      </div>

      {/* Task Creation Form (collapsible) */}
      {isAdding && (
        <form onSubmit={handleCreate} className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-display font-bold text-xs text-slate-200">Add New Life Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Task Title</label>
              <input
                type="text"
                required
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Due Date</label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Description</label>
              <textarea
                placeholder="Add secondary notes, instructions, or steps..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 h-14 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Priority Level</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`flex-1 text-[10px] font-medium py-1 rounded-md border capitalize transition-all cursor-pointer ${
                      newPriority === p
                        ? p === 'high'
                          ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                          : p === 'medium'
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                          : 'bg-blue-500/25 text-blue-300 border-blue-500/40 ring-1 ring-blue-500/30'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task Filters and Search */}
      <div className="glass-card p-3.5 rounded-xl flex flex-col md:flex-row justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
          />
        </div>

        {/* Filter status & priority */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Editing Task modal overlay */}
      {editingId && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="font-display font-bold text-white text-sm">Edit Task Info</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Task Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Due Date</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 h-16 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Priority Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`flex-1 text-[10px] font-medium py-1 rounded-md border capitalize transition-all cursor-pointer ${
                        editPriority === p
                          ? p === 'high'
                            ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                            : p === 'medium'
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                            : 'bg-blue-500/25 text-blue-300 border-blue-500/40 ring-1 ring-blue-500/30'
                          : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs text-slate-400 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List Grid/Layout */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-slate-400 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-display font-semibold text-slate-200">No matching tasks found</p>
          <p className="text-xs text-slate-500 mt-1">Try tweaking your search term, modifying your filters, or create a task.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";
            return (
              <div
                key={t.id}
                className={`glass-card rounded-xl p-4 transition-all flex flex-col justify-between gap-3 ${
                  isCompleted ? "border-slate-800/40 opacity-60" : "border-slate-800"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    {/* Title with checkbox */}
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <button
                        onClick={() => onUpdateTask(t.id, { status: isCompleted ? "pending" : "completed" })}
                        className={`mt-0.5 rounded-full transition-colors shrink-0 cursor-pointer ${
                          isCompleted ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        ) : (
                          <Circle className="w-4.5 h-4.5" />
                        )}
                      </button>
                      <h4
                        className={`text-xs font-semibold text-slate-100 truncate leading-snug ${
                          isCompleted ? "line-through text-slate-500" : ""
                        }`}
                      >
                        {t.title}
                      </h4>
                    </div>

                    {/* Priority badge */}
                    <span
                      className={`text-[8px] font-mono tracking-wide px-2 py-0.5 rounded-md uppercase shrink-0 border ${
                        t.priority === "high"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : t.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  {/* Description */}
                  {t.description && (
                    <p className={`text-xs text-slate-400 pl-7 leading-relaxed ${isCompleted ? "line-through text-slate-600" : ""}`}>
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Footer metadata & buttons */}
                <div className="flex justify-between items-center pl-7 pt-2 border-t border-slate-800/80">
                  {/* Deadline indicator */}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono">
                      {t.deadline
                        ? new Date(t.deadline).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                        : "No deadline"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
