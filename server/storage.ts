import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if not already loaded
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      if (line.trim() && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim();
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
    console.log("[STORAGE.TS] Loaded .env.local - DATABASE_URL:", !!process.env.DATABASE_URL);
  }
}

// Check if we're in a Netlify/serverless environment
const isServerless = process.env.NETLIFY === "true" || !fs.existsSync || !fs.writeFileSync;

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface StoredJsonQuiz {
  id: string;
  title: string;
  data: Question[];
  createdAt: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveQuiz(title: string, quizData: any): Promise<StoredJsonQuiz>;
  getStoredQuizzes(): Promise<StoredJsonQuiz[]>;
  deleteQuiz(quizId: string): Promise<boolean>;
}

// Fallback Memory Storage (for development without database)
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quizzes: Map<string, StoredJsonQuiz>;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveQuiz(title: string, quizData: any): Promise<StoredJsonQuiz> {
    const id = randomUUID();
    const quiz: StoredJsonQuiz = {
      id,
      title,
      data: quizData.data || quizData,
      createdAt: new Date().toISOString()
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getStoredQuizzes(): Promise<StoredJsonQuiz[]> {
    return Array.from(this.quizzes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteQuiz(quizId: string): Promise<boolean> {
    return this.quizzes.delete(quizId);
  }
}

// File-based Storage (for local development)
export class FileStorage implements IStorage {
  private users: Map<string, User>;
  private quizzes: Map<string, StoredJsonQuiz>;
  private quizzesDir: string;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.quizzesDir = path.join(process.cwd(), "server", "quizzes");
    
    if (!fs.existsSync(this.quizzesDir)) {
      fs.mkdirSync(this.quizzesDir, { recursive: true });
    }

    this.loadQuizzesFromDisk();
  }

  private loadQuizzesFromDisk() {
    try {
      if (!fs.existsSync(this.quizzesDir)) return;
      
      const files = fs.readdirSync(this.quizzesDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const filePath = path.join(this.quizzesDir, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const quiz = JSON.parse(content);
            this.quizzes.set(quiz.id, quiz);
          } catch (error) {
            console.error(`Failed to load quiz from ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load quizzes from disk:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveQuiz(title: string, quizData: any): Promise<StoredJsonQuiz> {
    const id = randomUUID();
    const quiz: StoredJsonQuiz = {
      id,
      title,
      data: quizData.data || quizData,
      createdAt: new Date().toISOString()
    };

    this.quizzes.set(id, quiz);

    try {
      const filePath = path.join(this.quizzesDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
      console.log(`Quiz saved to: ${filePath}`);
    } catch (error) {
      console.error("Failed to save quiz to disk:", error);
    }

    return quiz;
  }

  async getStoredQuizzes(): Promise<StoredJsonQuiz[]> {
    return Array.from(this.quizzes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteQuiz(quizId: string): Promise<boolean> {
    const deleted = this.quizzes.delete(quizId);
    
    try {
      const filePath = path.join(this.quizzesDir, `${quizId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Quiz deleted from: ${filePath}`);
      }
    } catch (error) {
      console.error("Failed to delete quiz from disk:", error);
    }

    return deleted;
  }
}

// Choose storage based on environment
let storage: IStorage;

// Initialize storage asynchronously
(async () => {
  console.log("[STORAGE] DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("[STORAGE] isServerless:", isServerless);
  console.log("[STORAGE] NETLIFY env:", !!process.env.NETLIFY);

  if (process.env.DATABASE_URL) {
    // Use Neon PostgreSQL in production
    console.log("[STORAGE] ✓ Using Neon PostgreSQL for storage");
    const { NeonStorage } = await import("./storage-neon");
    storage = new NeonStorage();
  } else if (isServerless || process.env.NETLIFY) {
    // Use memory storage in serverless environments without database
    console.log("[STORAGE] ✓ Using memory storage (serverless environment)");
    storage = new MemStorage();
  } else {
    // Use file storage in local development
    console.log("[STORAGE] ✓ Using file storage (local development)");
    storage = new FileStorage();
  }
})();

export { storage };

