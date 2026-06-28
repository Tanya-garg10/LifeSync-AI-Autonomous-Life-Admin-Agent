import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

import {
  getTasks,
  saveTask,
  updateTask,
  deleteTask,
  getMemory,
  saveMemory,
  deleteMemory,
  getChatMessages,
  saveChatMessage,
  clearChatHistory
} from "./src/firebase-service.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set. Chat features will not work.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- REST APIs ---

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, deadline, priority, status } = req.body;
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const task = await saveTask({
      title,
      description: description || "",
      deadline: deadline || "",
      priority: priority || "medium",
      status: status || "pending",
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, priority, status } = req.body;
    await updateTask(id, { title, description, deadline, priority, status });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTask(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get memories
app.get("/api/memory", async (req, res) => {
  try {
    const memories = await getMemory();
    res.json(memories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update memory
app.post("/api/memory", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      res.status(400).json({ error: "Key and value are required" });
      return;
    }
    const memory = await saveMemory(key, value);
    res.json(memory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete memory
app.delete("/api/memory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteMemory(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chats
app.get("/api/chats", async (req, res) => {
  try {
    const chats = await getChatMessages();
    res.json(chats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history
app.delete("/api/chats", async (req, res) => {
  try {
    await clearChatHistory();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI CHAT AGENT (LANGRAPH-INSPIRED MULTI-TURN TOOL-CALLING WORKFLOW) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key is missing. Please set it in secrets." });
      return;
    }

    // 1. Save user's message to chat history
    await saveChatMessage("user", message);

    // 2. Load context from DB
    const currentTasks = await getTasks();
    const currentMemories = await getMemory();
    const chatHistory = await getChatMessages();

    // Limit chat history context to last 15 messages to stay within limits
    const recentHistory = chatHistory.slice(-15);

    // Format current date and time
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const nowTimeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build rich, grounding system instructions with memory bank and current tasks
    const systemInstruction = `You are LifeSync AI, an autonomous life admin agent.
Your goal is to help users manage their daily life tasks, planners, and personal memories.

Current System Date/Time: ${todayStr} at ${nowTimeStr}

=== CURRENT USER MEMORY BANK ===
${
  currentMemories.length > 0
    ? currentMemories.map((m) => `- ${m.key}: ${m.value}`).join("\n")
    : "No saved memories yet."
}

=== CURRENT TASK LIST ===
${
  currentTasks.length > 0
    ? currentTasks
        .map(
          (t) =>
            `- [${t.status.toUpperCase()}] "${t.title}" (ID: ${t.id}, Priority: ${t.priority}${
              t.deadline ? `, Due: ${t.deadline}` : ""
            }${t.description ? `, Desc: ${t.description}` : ""})`
        )
        .join("\n")
    : "No active tasks."
}

Agent Directives:
1. When the user tells you about their preferences, schedules, reminders, or general life facts (e.g. "I sleep at 11 PM", "Remind me in the mornings"), ALWAYS use 'saveMemory' to store it.
2. When the user asks you to remind them, schedule something, or do a task (e.g. "Pay bill on July 5", "Dentist next Friday"), ALWAYS use 'createTask'.
3. If the user mentions completing a task or asks you to mark it as done, use 'updateTask' with status="completed".
4. If they ask you to delete or remove a task or memory, use 'deleteTask' or 'deleteMemory'.
5. If the user mentions an intense week or exams or a trip, use 'createStudyPlan' or 'createPlanner' by creating multiple separate tasks styled with deadlines.
6. Be conversational, concise, and helpful. Do not mention system-internal IDs or technical schemas. Simply act on the command and explain what you did.
`;

    // Map conversation for Gemini
    // Gemini 2.5 Flash expects chat-like list or prompt string. We'll build the content.
    const contents = recentHistory.map((h) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    // Declare tools
    const toolDeclarations = [
      {
        name: "createTask",
        description: "Creates a new task in the user's task manager.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Clear, summary title of the task" },
            description: { type: Type.STRING, description: "Detailed description or notes about the task" },
            deadline: { type: Type.STRING, description: "Due date in YYYY-MM-DD format (if unspecified, try to infer based on current date)" },
            priority: { type: Type.STRING, description: "Priority level: 'high', 'medium', or 'low'", enum: ["high", "medium", "low"] },
          },
          required: ["title"],
        },
      },
      {
        name: "updateTask",
        description: "Updates an existing task's fields like status, deadline, or priority.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The ID of the task to update (e.g. 'task_12345')" },
            status: { type: Type.STRING, description: "The updated status: 'pending' or 'completed'", enum: ["pending", "completed"] },
            title: { type: Type.STRING, description: "Updated title" },
            deadline: { type: Type.STRING, description: "Updated due date in YYYY-MM-DD" },
            priority: { type: Type.STRING, description: "Updated priority", enum: ["high", "medium", "low"] },
          },
          required: ["id"],
        },
      },
      {
        name: "deleteTask",
        description: "Removes/deletes a task from the list.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The ID of the task to delete" },
          },
          required: ["id"],
        },
      },
      {
        name: "saveMemory",
        description: "Saves or updates a personal fact, preference, or schedule into the user's persistent memory bank.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: { type: Type.STRING, description: "What this memory is about (e.g., 'Bedtime', 'Favorite Coffee', 'Office Hours')" },
            value: { type: Type.STRING, description: "The actual detail/preference to remember" },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "deleteMemory",
        description: "Removes/deletes a specific memory.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The ID of the memory to delete (usually lowercased/sanitized key)" },
          },
          required: ["id"],
        },
      },
    ];

    // Call Gemini 2.5 Flash
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const actionsTaken: Array<{ type: string; details: any }> = [];

    // Process tool calls if any
    const calls = geminiResponse.functionCalls;
    let finalModelResponse = geminiResponse.text || "";

    if (calls && calls.length > 0) {
      console.log("Gemini triggered tool calls:", JSON.stringify(calls, null, 2));

      for (const call of calls) {
        const { name, args } = call;
        try {
          if (name === "createTask") {
            const tArgs = args as any;
            const created = await saveTask({
              title: tArgs.title,
              description: tArgs.description || "",
              deadline: tArgs.deadline || "",
              priority: tArgs.priority || "medium",
              status: "pending",
            });
            actionsTaken.push({ type: "createTask", details: created });
          } else if (name === "updateTask") {
            const uArgs = args as any;
            const { id, ...updates } = uArgs;
            await updateTask(id, updates);
            actionsTaken.push({ type: "updateTask", details: { id, ...updates } });
          } else if (name === "deleteTask") {
            const dArgs = args as any;
            await deleteTask(dArgs.id);
            actionsTaken.push({ type: "deleteTask", details: { id: dArgs.id } });
          } else if (name === "saveMemory") {
            const mArgs = args as any;
            const saved = await saveMemory(mArgs.key, mArgs.value);
            actionsTaken.push({ type: "saveMemory", details: saved });
          } else if (name === "deleteMemory") {
            const dmArgs = args as any;
            await deleteMemory(dmArgs.id);
            actionsTaken.push({ type: "deleteMemory", details: { id: dmArgs.id } });
          }
        } catch (err: any) {
          console.error(`Error executing tool ${name}:`, err);
        }
      }

      // Feed results back to Gemini for a friendly conversational response
      const followUpContents = [
        ...contents,
        {
          role: "model",
          parts: [{ text: "I will execute these operations to update your life schedule." }]
        },
        {
          role: "user",
          parts: [{
            text: `Tool execution logs:\n${actionsTaken
              .map((act) => `- Executed ${act.type} with details: ${JSON.stringify(act.details)}`)
              .join("\n")}\n\nPlease generate a very friendly, polite confirmation of what was successfully done.`
          }]
        }
      ];

      const followUpRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: followUpContents,
        config: { systemInstruction },
      });

      finalModelResponse = followUpRes.text || "Operations completed successfully!";
    }

    if (!finalModelResponse) {
      finalModelResponse = "I have updated your admin schedule accordingly.";
    }

    // Save final response to chat history
    await saveChatMessage("model", finalModelResponse);

    res.json({
      reply: finalModelResponse,
      actions: actionsTaken,
    });
  } catch (error: any) {
    console.error("Chat agent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE SETUP FOR FULL-STACK INTEGRATION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite in middleware mode for dev...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static assets in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LifeSync AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
