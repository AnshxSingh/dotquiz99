import { Pool } from "pg";
import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

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

// Initialize Neon connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database tables
async function initializeDatabase() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`Attempting to initialize database (attempt ${attempt + 1}/${maxRetries})...`);
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255)
        );
      `);
      console.log("✓ Users table created/verified");

      // Create quizzes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id UUID PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✓ Quizzes table created/verified");

      console.log("✓ Database initialized successfully");
      return true;
    } catch (error) {
      attempt++;
      console.error(`Database initialization attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error("Failed to initialize database after retries");
        throw error;
      }
    }
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveQuiz(title: string, quizData: any): Promise<StoredJsonQuiz>;
  getStoredQuizzes(): Promise<StoredJsonQuiz[]>;
  deleteQuiz(quizId: string): Promise<boolean>;
}

export class NeonStorage implements IStorage {
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await initializeDatabase();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize NeonStorage:", error);
    }
  }

  private async ensureInitialized() {
    let retries = 0;
    while (!this.initialized && retries < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    if (!this.initialized) {
      throw new Error("Database initialization timed out");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    const id = randomUUID();
    try {
      const result = await pool.query(
        "INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING *",
        [id, insertUser.username, insertUser.password]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async saveQuiz(title: string, quizData: any): Promise<StoredJsonQuiz> {
    await this.ensureInitialized();
    const id = randomUUID();
    const data = quizData.data || quizData;
    const createdAt = new Date().toISOString();

    try {
      console.log("[NEON] Inserting quiz:", { id, title, questionsCount: data.length });
      const result = await pool.query(
        "INSERT INTO quizzes (id, title, data) VALUES ($1, $2, $3) RETURNING *",
        [id, title, JSON.stringify({ data })]
      );

      console.log("[NEON] Quiz inserted successfully. Rows returned:", result.rows.length);
      const row = result.rows[0];
      const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;

      return {
        id: row.id,
        title: row.title,
        data: parsedData.data,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error("[NEON] Error saving quiz:", error);
      throw error;
    }
  }

  async getStoredQuizzes(): Promise<StoredJsonQuiz[]> {
    try {
      await this.ensureInitialized();
      const result = await pool.query(
        "SELECT * FROM quizzes ORDER BY created_at DESC"
      );

      return result.rows.map((row) => {
        const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
        return {
          id: row.id,
          title: row.title,
          data: parsedData.data,
          createdAt: row.created_at
        };
      });
    } catch (error) {
      console.error("Error getting stored quizzes:", error);
      return [];
    }
  }

  async deleteQuiz(quizId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const result = await pool.query(
        "DELETE FROM quizzes WHERE id = $1",
        [quizId]
      );
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting quiz:", error);
      return false;
    }
  }
}
