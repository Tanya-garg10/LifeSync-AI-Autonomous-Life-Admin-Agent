import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { Task, Memory, ChatMessage } from "./types.js";

// Load config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
});

// Initialize Firestore with custom Database ID
export const db = initializeFirestore(app, {}, config.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

const TASKS_COLL = "tasks";
const MEMORY_COLL = "memory";
const CHATS_COLL = "chats";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- TASKS API ---
export async function getTasks(): Promise<Task[]> {
  const colRef = collection(db, TASKS_COLL);
  try {
    const snapshot = await getDocs(colRef);
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        title: data.title,
        description: data.description || "",
        deadline: data.deadline || "",
        priority: data.priority || "medium",
        status: data.status || "pending",
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    // Sort tasks by createdAt descending
    return tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, TASKS_COLL);
  }
}

export async function saveTask(task: Omit<Task, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<Task> {
  const id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = task.createdAt || new Date().toISOString();
  const docRef = doc(db, TASKS_COLL, id);
  const newTask: Task = {
    ...task,
    id,
    createdAt,
  };
  try {
    await setDoc(docRef, newTask);
    return newTask;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TASKS_COLL}/${id}`);
  }
}

export async function updateTask(id: string, updates: Partial<Omit<Task, "id">>): Promise<void> {
  const docRef = doc(db, TASKS_COLL, id);
  // Remove undefined properties to avoid Firestore validation errors
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  try {
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TASKS_COLL}/${id}`);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLL, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLL}/${id}`);
  }
}

// --- MEMORY API ---
export async function getMemory(): Promise<Memory[]> {
  const colRef = collection(db, MEMORY_COLL);
  try {
    const snapshot = await getDocs(colRef);
    const memories: Memory[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      memories.push({
        id: doc.id,
        key: data.key,
        value: data.value,
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });
    return memories;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, MEMORY_COLL);
  }
}

export async function saveMemory(key: string, value: string): Promise<Memory> {
  const id = key.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const docRef = doc(db, MEMORY_COLL, id);
  const updatedAt = new Date().toISOString();
  const memory: Memory = {
    id,
    key,
    value,
    updatedAt,
  };
  try {
    await setDoc(docRef, memory);
    return memory;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${MEMORY_COLL}/${id}`);
  }
}

export async function deleteMemory(id: string): Promise<void> {
  const docRef = doc(db, MEMORY_COLL, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MEMORY_COLL}/${id}`);
  }
}

// --- CHAT HISTORY API ---
export async function getChatMessages(): Promise<ChatMessage[]> {
  const colRef = collection(db, CHATS_COLL);
  try {
    const snapshot = await getDocs(colRef);
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });
    return messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CHATS_COLL);
  }
}

export async function saveChatMessage(sender: "user" | "model", text: string): Promise<ChatMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const docRef = doc(db, CHATS_COLL, id);
  const msg: ChatMessage = {
    id,
    sender,
    text,
    timestamp: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, msg);
    return msg;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CHATS_COLL}/${id}`);
  }
}

export async function clearChatHistory(): Promise<void> {
  const colRef = collection(db, CHATS_COLL);
  try {
    const snapshot = await getDocs(colRef);
    const promises: Promise<void>[] = [];
    snapshot.forEach((doc) => {
      promises.push(deleteDoc(doc.ref));
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, CHATS_COLL);
  }
}
