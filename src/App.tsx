import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  MessageSquareShare,
  CalendarDays,
  Brain,
  ListTodo,
  Terminal,
  LogOut,
  Sparkles,
  RefreshCw,
  Clock,
  Github
} from "lucide-react";

import { Task, Memory, ChatMessage } from "./types.js";
import DashboardView from "./components/DashboardView.js";
import ChatView from "./components/ChatView.js";
import TaskManagerView from "./components/TaskManagerView.js";
import MemoryView from "./components/MemoryView.js";
import PlannerView from "./components/PlannerView.js";

type Tab = "dashboard" | "chat" | "tasks" | "memory" | "planner";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTasks(), fetchMemory(), fetchChats()]);
    } catch (error) {
      console.error("Error loading application data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
  };

  const fetchMemory = async () => {
    const res = await fetch("/api/memory");
    if (res.ok) {
      const data = await res.json();
      setMemories(data);
    }
  };

  const fetchChats = async () => {
    const res = await fetch("/api/chats");
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  // --- TASKS ACTIONS ---
  const handleAddTask = async (title: string, priority: 'high' | 'medium' | 'low', deadline?: string, description?: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, deadline, description }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await handleUpdateTask(task.id, { status: newStatus });
  };

  // --- MEMORY ACTIONS ---
  const handleAddMemory = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        await fetchMemory();
      }
    } catch (error) {
      console.error("Failed to add memory:", error);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMemory();
      }
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  // --- CHAT ACTIONS ---
  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    // Append user's message immediately
    const userMsg: ChatMessage = {
      id: `local_user_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        // Append model's response
        const modelMsg: ChatMessage = {
          id: `local_model_${Date.now()}`,
          sender: "model",
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, modelMsg]);

        // Refresh lists in background since agent might have modified database!
        await fetchTasks();
        await fetchMemory();

        return data; // Return details for logs
      }
    } catch (error) {
      console.error("Failed to communicate with chat agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChats = async () => {
    try {
      const res = await fetch("/api/chats", { method: "DELETE" });
      if (res.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  };

  const handleGeneratePlan = async (prompt: string) => {
    setActiveTab("chat");
    await handleSendMessage(prompt);
  };

  const navigationItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "chat" as Tab, label: "Chat Agent", icon: MessageSquareShare },
    { id: "tasks" as Tab, label: "Task Admin", icon: ListTodo },
    { id: "memory" as Tab, label: "Memory Bank", icon: Brain },
    { id: "planner" as Tab, label: "Week Planner", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row font-sans text-slate-200 overflow-x-hidden">
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="w-full md:w-56 bg-[#0f172a] text-slate-200 flex flex-col justify-between border-r border-slate-800 shrink-0 md:h-screen sticky top-0 z-40 select-none">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              <div>
                <h1 className="font-display font-bold text-sm tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  LifeSync AI
                </h1>
                <p className="text-[9px] font-mono text-slate-500 tracking-wider uppercase font-semibold">
                  Autonomous Life Admin
                </p>
              </div>
            </div>
            <button
              onClick={fetchInitialData}
              disabled={isRefreshing}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Refresh core data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 shadow-sm border border-blue-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850/40 text-center flex flex-col gap-2">
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5 justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Agent Status</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">Gemini 2.5 Flash: Online</div>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN STAGE */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="focus:outline-none"
          >
            {activeTab === "dashboard" && (
              <DashboardView
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleStatus={handleToggleTaskStatus}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "chat" && (
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearHistory={handleClearChats}
                isLoading={isLoading}
              />
            )}

            {activeTab === "tasks" && (
              <TaskManagerView
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === "memory" && (
              <MemoryView
                memories={memories}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
              />
            )}

            {activeTab === "planner" && (
              <PlannerView
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onGeneratePlan={handleGeneratePlan}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
