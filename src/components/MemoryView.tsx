import React, { useState } from "react";
import { Memory } from "../types.js";
import { Brain, Trash2, Plus, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface MemoryViewProps {
  memories: Memory[];
  onAddMemory: (key: string, value: string) => void;
  onDeleteMemory: (id: string) => void;
}

export default function MemoryView({ memories, onAddMemory, onDeleteMemory }: MemoryViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    onAddMemory(key, value);
    setKey("");
    setValue("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Brain className="w-4.5 h-4.5 text-blue-400" /> Agent Memory Bank
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">The context repository LifeSync AI refers to for scheduling and personalized advice.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Inject Fact
        </button>
      </div>

      {/* Manual Memory Injection Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4 space-y-3 max-w-lg">
          <h3 className="font-display font-bold text-xs text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" /> Inject New Fact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Context Key</label>
              <input
                type="text"
                placeholder="e.g. Sleep Schedule, Office Hours"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase text-slate-500">Preference Detail / Value</label>
              <input
                type="text"
                placeholder="e.g. Sleep at 11 PM, Bed by 11:30"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
              />
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
              Inject Fact
            </button>
          </div>
        </form>
      )}

      {/* Memory Cards Grid */}
      {memories.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center text-slate-400 max-w-sm mx-auto space-y-3">
          <Brain className="w-8 h-8 mx-auto text-blue-400/40 animate-pulse" />
          <div>
            <p className="font-display font-semibold text-slate-200 text-xs">Memory bank is empty</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              LifeSync AI currently has no contextual records. Go to the Chat and say things like:
              <br />
              <span className="inline-block mt-2 font-mono text-[10px] text-blue-300 bg-slate-900/85 border border-slate-800 px-1.5 py-0.5 rounded">"I drink green tea in the morning"</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {memories.map((m) => (
            <div
              key={m.id}
              className="glass-card rounded-xl p-4 flex flex-col justify-between hover:bg-slate-800/40 transition-all group relative overflow-hidden"
            >
              {/* Card Header Key */}
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                  {m.key}
                </span>
                {/* Value detail */}
                <p className="text-slate-200 text-xs font-semibold mt-3 leading-relaxed">
                  {m.value}
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-850 text-slate-500">
                <span className="text-[8px] font-mono">
                  Sync: {new Date(m.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Wipe fact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informational Guidance */}
      <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl flex gap-3 max-w-2xl mt-4">
        <AlertCircle className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-display font-bold text-slate-200 text-xs">How does memory recall work?</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            During any chat session, LifeSync AI pre-fetches this entire Memory Bank. This memory context is injected into Gemini's system instructions, providing persistent long-term recall. If you tell the agent about your lifestyle, it will update this repository automatically!
          </p>
        </div>
      </div>
    </div>
  );
}
