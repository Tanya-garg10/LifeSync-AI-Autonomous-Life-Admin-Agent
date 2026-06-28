import React, { useState, useEffect } from "react";
import { Task } from "../types.js";
import { Clock, Calendar, CheckCircle2, Circle, AlertCircle, Sparkles, Send, Check } from "lucide-react";

interface DashboardViewProps {
  tasks: Task[];
  onAddTask: (title: string, priority: 'high' | 'medium' | 'low', deadline?: string) => void;
  onToggleStatus: (task: Task) => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ tasks, onAddTask, onToggleStatus, setActiveTab }: DashboardViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<'high' | 'medium' | 'low'>("medium");
  const [quickDeadline, setQuickDeadline] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter((t) => t.priority === "high" && t.status === "pending").length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask(quickTitle, quickPriority, quickDeadline || undefined);
    setQuickTitle("");
    setQuickDeadline("");
    setQuickPriority("medium");
  };

  // Get upcoming 3 pending tasks with deadlines
  const upcomingTasks = tasks
    .filter((t) => t.status === "pending" && t.deadline)
    .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
    .slice(0, 3);

  // Formatting date/time beautifully
  const timeString = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = currentTime.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Dynamic Header */}
      <div className="glass-card rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">
            Welcome to LifeSync AI
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Your autonomous life admin assistant is online and synchronized.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-lg font-mono text-xs text-slate-300 shadow-inner">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col items-end">
            <span className="font-bold text-white tracking-wide">{timeString}</span>
            <span className="text-[10px] text-slate-500">{dateString}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="glass-card p-4 rounded-xl hover:bg-slate-800/55 transition-all">
          <div className="flex justify-between items-start text-blue-400">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">Total Tasks</span>
            <span className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg"><Calendar className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-white">{totalTasks}</span>
            <span className="text-[10px] text-slate-500 font-mono">records</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card p-4 rounded-xl hover:bg-slate-800/55 transition-all">
          <div className="flex justify-between items-start text-amber-400">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">Pending</span>
            <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"><Circle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-white">{pendingTasks}</span>
            <span className="text-[10px] text-slate-500 font-mono">active</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card p-4 rounded-xl hover:bg-slate-800/55 transition-all">
          <div className="flex justify-between items-start text-emerald-400">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">Completed</span>
            <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-white">{completedTasks}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%"} done
            </span>
          </div>
        </div>

        {/* High Priority Alerts */}
        <div className="glass-card p-4 rounded-xl hover:bg-slate-800/55 transition-all">
          <div className="flex justify-between items-start text-rose-400">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">High Priority</span>
            <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg"><AlertCircle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-white">{highPriorityTasks}</span>
            <span className="text-[10px] text-rose-400 font-mono">unresolved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quick Task Capture */}
        <div className="glass-card rounded-xl p-5 lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="font-display font-bold text-white text-sm">Quick Capture Entry</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Add a task directly into your inbox. The autonomous planner will schedule and monitor it.
            </p>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Pay electric bill, study biology, book flights..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors text-slate-200 placeholder:text-slate-500"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as any)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-300"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={quickDeadline}
                    onChange={(e) => setQuickDeadline(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-300"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
              >
                Save to Inbox
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Upcoming Deadlines
            </h3>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No upcoming deadlines.
                <button
                  onClick={() => setActiveTab("tasks")}
                  className="block mx-auto mt-2 text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Create a task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <button
                        onClick={() => onToggleStatus(t)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-200 truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Due: {new Date(t.deadline || "").toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${
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
                ))}
              </div>
            )}
          </div>
          {upcomingTasks.length > 0 && (
            <button
              onClick={() => setActiveTab("tasks")}
              className="text-center text-xs text-blue-400 font-semibold mt-3 hover:underline block w-full cursor-pointer"
            >
              View all tasks
            </button>
          )}
        </div>
      </div>

      {/* Proactive Agent Suggestion Box */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950/80 border border-slate-800 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-blue-400 text-xs font-mono uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Autonomous Agent Action
          </div>
          <h4 className="text-base font-display font-bold">Have an exam, event, or a chaotic week?</h4>
          <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
            Go to the chat and type <code className="bg-white/5 border border-white/15 px-1 py-0.5 rounded font-mono text-[10px] text-blue-300">I have finals week next week, help me schedule</code> or <code className="bg-white/5 border border-white/15 px-1 py-0.5 rounded font-mono text-[10px] text-blue-300">Create a workout plan</code>. The agent will split it into structured tasks instantly.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("chat")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          Talk to Agent
        </button>
      </div>
    </div>
  );
}
