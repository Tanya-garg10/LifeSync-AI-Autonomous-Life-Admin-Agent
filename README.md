# 🚀 LifeSync AI – Autonomous Life Admin Agent

## 🧠 Overview

LifeSync AI is an **autonomous AI-powered life administration agent** that helps users manage daily tasks, schedules, learning plans, and productivity workflows.

Unlike traditional reminder apps, LifeSync AI **understands user intent, plans actions, and automates task organization intelligently** using AI agents.

## 🎯 Problem Statement

Modern users struggle with:

* Managing multiple tasks across different apps
* Missing deadlines and important events
* Lack of intelligent planning systems
* Manual effort in organizing daily schedules

Existing tools only provide **static reminders**, not intelligent decision-making.

## 💡 Solution

LifeSync AI acts as a **personal AI operating system** that:

* Understands natural language commands
* Extracts tasks, deadlines, and priorities
* Automatically generates structured plans
* Maintains long-term memory of user habits
* Organizes tasks into actionable schedules

## ⚙️ Features

* 🤖 AI Chat Assistant (Task creation via chat)
* 📅 Smart Task Scheduler
* 🧠 Memory-based personalization
* ⚡ Auto prioritization of tasks
* 📊 Dashboard with task overview
* 📌 Deadline tracking system
* 🔄 Weekly schedule planner

## 🏗️ Tech Stack

* **Frontend:** React + Vite + Tailwind CSS
* **Backend:** FastAPI (Python)
* **AI Model:** Gemini 2.5 Flash
* **Agent Framework:** LangGraph
* **Database:** SQLite
* **APIs:** REST APIs

## 🧩 System Architecture

User Input
→ AI Chat Interface
→ Intent Recognition (LangGraph Agent)
→ Memory Module
→ Task Planning Engine
→ Task Execution Layer
→ Database Update
→ Dashboard UI Update

## 🖥️ Project Structure

```
lifesync-ai/
│
├── frontend/
│   ├── src/
│   └── components/
│
├── backend/
│   ├── agents/
│   ├── api/
│   ├── models/
│   ├── database/
│   └── main.py
│
└── README.md
```

## 🚀 Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/your-username/lifesync-ai.git
cd lifesync-ai
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🧪 Example Usage

### Input:

> “I have biology exams next week, make a study plan”

### Output:

* Daily structured study schedule
* Prioritized tasks
* Calendar entries

## 📈 Impact

LifeSync AI helps users:

* Save time in planning
* Avoid missed deadlines
* Improve productivity
* Reduce mental workload
* Automate daily organization

## 🔮 Future Improvements

* Voice assistant integration
* Google Calendar sync
* Email automation
* Mobile app version
* Multi-agent collaboration system

## 👨‍💻 Author

Tanya Garg

## 🏁 Conclusion

LifeSync AI demonstrates the power of **autonomous AI agents** by combining reasoning, planning, memory, and execution into a single intelligent system.

