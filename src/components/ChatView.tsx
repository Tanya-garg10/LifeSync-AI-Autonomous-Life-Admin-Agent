import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types.js";
import { Send, Sparkles, Terminal, Trash2, ArrowRight, BrainCircuit, User, Mic, MicOff } from "lucide-react";

function renderMessageText(text: string) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    let isBullet = false;
    let cleanLine = line;

    // Check if line is a bullet point (e.g. "* " or "- ")
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      isBullet = true;
      cleanLine = line.replace(/^\s*[\*\-]\s+/, "");
    }

    // Now split the line by "**" to parse bold elements
    const parts = cleanLine.split("**");
    const formattedParts = parts.map((part, idx) => {
      // Parse inline backticks `code` inside the part
      const codeParts = part.split("`");
      const subElements = codeParts.map((subPart, sIdx) => {
        if (sIdx % 2 === 1) {
          return (
            <code key={`code-${sIdx}`} className="bg-slate-950/80 px-1.5 py-0.5 rounded text-rose-400 font-mono text-[10px] border border-slate-800">
              {subPart}
            </code>
          );
        }
        return subPart;
      });

      // Odd indices are bold
      if (idx % 2 === 1) {
        return <strong key={idx} className="font-bold text-white">{subElements}</strong>;
      }
      return <React.Fragment key={idx}>{subElements}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex gap-2 items-start mt-1 ml-2">
          <span className="text-blue-400 select-none mt-1 shrink-0">•</span>
          <div className="flex-1">{formattedParts}</div>
        </div>
      );
    }

    return (
      <div key={lineIdx} className={lineIdx > 0 ? "mt-1" : ""}>
        {formattedParts}
      </div>
    );
  });
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<any>;
  onClearHistory: () => void;
  isLoading: boolean;
}

const PRESETS = [
  "Pay electric bill on July 5th",
  "I sleep at 11:30 PM, make a note",
  "Study plan for biology exams next Mon to Wed",
  "Add dentist appointment next Friday at 2 PM",
];

export default function ChatView({ messages, onSendMessage, onClearHistory, isLoading }: ChatViewProps) {
  const [inputText, setInputText] = useState("");
  const [agentLogs, setAgentLogs] = useState<Array<{ text: string; timestamp: string; type: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      addLog("Voice recognition activated. Speak into your microphone...", "system");
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
        addLog(`Speech transcribed: "${transcript}"`, "system");
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        addLog("Microphone permission denied. Please allow microphone access in your browser.", "system");
      } else {
        addLog(`Speech recognition error: ${event.error}`, "system");
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      addLog("Speech recognition is not supported in this browser.", "system");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
        addLog("Failed to start speech recognition.", "system");
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const sentMsg = inputText;
    setInputText("");

    // Add local log to simulate agent thinking process
    addLog("Thinking...", "system");
    const result = await onSendMessage(sentMsg);

    if (result && result.actions && result.actions.length > 0) {
      result.actions.forEach((act: any) => {
        addLog(`Executed: ${act.type} (${JSON.stringify(act.details)})`, "tool");
      });
    } else {
      addLog("Processed conversational input", "response");
    }
  };

  const handlePresetClick = (preset: string) => {
    setInputText(preset);
  };

  const addLog = (text: string, type: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAgentLogs((prev) => [{ text, timestamp, type }, ...prev]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
      {/* Conversation Panel */}
      <div className="glass-card rounded-xl flex flex-col justify-between overflow-hidden lg:col-span-8 h-full">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-slate-800/80 flex justify-between items-center bg-[#0f172a]/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="font-display font-bold text-white text-xs">Autonomous Admin Agent</h3>
              <p className="text-[9px] text-slate-400 font-mono">Gemini 2.5 Flash • LangGraph Agent Loop</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              title="Clear history"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 space-y-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                <BrainCircuit className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-200 text-sm">Start syncing your life</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Type a command, ask to organize your tasks, log a preference, or request a planner schedule.
                </p>
              </div>
              <div className="w-full space-y-2 mt-2">
                <p className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider text-left pl-1">Suggested prompts</p>
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(p)}
                    className="w-full text-left px-3 py-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-xs text-slate-300 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                        isUser ? "bg-slate-800 text-slate-300" : "bg-blue-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        isUser
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <div className="space-y-1">{renderMessageText(m.text)}</div>
                      <span
                        className={`block text-[8px] mt-1 text-right ${
                          isUser ? "text-blue-200" : "text-slate-500"
                        }`}
                      >
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2.5 max-w-[80%] mr-auto">
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white shrink-0 flex items-center justify-center">
                    <BrainCircuit className="w-3 h-3 animate-spin" />
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg rounded-tl-none text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-[#0f172a]/60 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type your command..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors text-slate-200 placeholder:text-slate-500 disabled:opacity-70"
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Start voice input"}
              className={`p-2.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer border ${
                isListening
                  ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Autonomous Agent Logs Panel */}
      <div className="bg-[#0f172a]/85 border border-slate-800/85 rounded-xl flex flex-col overflow-hidden lg:col-span-4 h-full shadow-lg">
        {/* Log Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-[10px] uppercase tracking-wider">Agent Execution Logs</span>
          </div>
          <span className="text-[8px] font-mono bg-blue-950 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded">
            Live Trace
          </span>
        </div>

        {/* Log Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-4 custom-scrollbar">
          {agentLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 space-y-2">
              <Terminal className="w-5 h-5 text-slate-600" />
              <p className="text-[10px]">System Idle</p>
              <p className="text-[9px] text-slate-600 max-w-[180px] leading-relaxed">
                Type a message in the chat. The agent will execute tool callbacks here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {agentLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-800/50 pb-2 last:border-0">
                  <div className="flex justify-between items-center mb-1 text-[9px] text-slate-500">
                    <span className="font-semibold">{log.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] uppercase ${
                        log.type === "tool"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900/60"
                          : log.type === "system"
                          ? "bg-amber-950 text-amber-400 border border-amber-900/60"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {log.type}
                    </span>
                  </div>
                  <p className="text-slate-300 break-words leading-relaxed text-[10px]">{log.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
