import React, { useState } from "react";
import { Task } from "../types.js";
import { CalendarRange, Sparkles, Send, CheckCircle2, Circle, Clock, Check } from "lucide-react";

interface PlannerViewProps {
  tasks: Task[];
  onAddTask: (title: string, priority: 'high' | 'medium' | 'low', deadline?: string, description?: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onGeneratePlan: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

export default function PlannerView({ tasks, onAddTask, onUpdateTask, onGeneratePlan, isLoading }: PlannerViewProps) {
  const [plannerPrompt, setPlannerPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerPrompt.trim() || isLoading) return;
    setIsGenerating(true);
    await onGeneratePlan(plannerPrompt);
    setPlannerPrompt("");
    setIsGenerating(false);
  };

  // Get current day index to show relative weekly view
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = new Date().getDay();

  // Map tasks to their due day (if deadline is defined)
  const getTasksForDay = (dayName: string) => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      const dayIndex = d.getDay();
      return daysOfWeek[dayIndex] === dayName;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-4.5 h-4.5 text-blue-400" /> Weekly Agenda Planner
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological orchestration of your upcoming tasks and study plans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Bento Schedule */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Weekly Schedule Timeline</h3>
          <div className="space-y-2">
            {daysOfWeek.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isToday = todayIndex === idx;

              return (
                <div
                  key={day}
                  className={`glass-card rounded-xl p-3.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isToday ? "border-blue-500/40 ring-1 ring-blue-500/20 bg-blue-950/10" : "border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className={`h-7 w-20 rounded-lg flex items-center justify-center text-[11px] font-bold font-display ${
                        isToday ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900/60 border border-slate-800 text-slate-300"
                      }`}
                    >
                      {day} {isToday && "• Now"}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">({dayTasks.length} tasks)</span>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No tasks due.</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {dayTasks.map((t) => {
                          const completed = t.status === "completed";
                          return (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-1.5 rounded-lg text-xs bg-slate-900/40 border border-slate-850 hover:bg-slate-800/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <button
                                  onClick={() => onUpdateTask(t.id, { status: completed ? "pending" : "completed" })}
                                  className={`transition-colors shrink-0 cursor-pointer ${
                                    completed ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
                                  }`}
                                >
                                  {completed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className={`font-medium truncate ${completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                                  {t.title}
                                </span>
                              </div>
                              <span
                                className={`text-[8px] font-mono shrink-0 px-1.5 py-0.2 rounded-md uppercase border ${
                                  t.priority === "high"
                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                    : t.priority === "medium"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                }`}
                              >
                                {t.priority}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Planner Builder */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">AI Planner Orchestrator</h3>
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg"><Sparkles className="w-4 h-4 animate-pulse" /></span>
              <h4 className="font-display font-bold text-slate-200 text-xs">Orchestrate plan</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe a project, curriculum, or travel timeline. LifeSync AI will break it down, calculate deadlines, prioritize them, and schedule them.
            </p>

            <form onSubmit={handleGenerate} className="space-y-3">
              <textarea
                placeholder="e.g. Build a marketing campaign for 3 days, study for final exams starting Monday..."
                value={plannerPrompt}
                onChange={(e) => setPlannerPrompt(e.target.value)}
                required
                disabled={isLoading || isGenerating}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-500 h-24 resize-none disabled:opacity-75"
              />

              <button
                type="submit"
                disabled={!plannerPrompt.trim() || isLoading || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Orchestrating...
                  </>
                ) : (
                  <>
                    Generate Action Plan
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-850 pt-3 space-y-2">
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Inspiration prompts</p>
              <div className="space-y-1.5">
                {[
                  "Study plan for chemistry final",
                  "Prepare client presentation in 3 days",
                  "Weekly workout schedule",
                ].map((insp) => (
                  <button
                    key={insp}
                    type="button"
                    onClick={() => setPlannerPrompt(`Generate a plan: ${insp}`)}
                    className="w-full text-left bg-slate-900/40 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 px-3 py-1.5 rounded-lg transition-colors flex justify-between items-center cursor-pointer"
                  >
                    <span>{insp}</span>
                    <span className="text-[10px] font-mono text-blue-400 font-medium">Use</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
