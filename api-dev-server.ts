/**
 * Local Development API Server
 *
 * This mirrors the Vercel serverless functions locally on port 3001.
 * Run alongside the Vite dev server (port 5000) which proxies /api/* here.
 *
 * Usage:
 *   npm run dev:api   (starts this server)
 *   npm run dev       (starts Vite frontend, in a separate terminal)
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local before anything else
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (line.trim() && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  }
  console.log("[ENV] Loaded .env.local");
  console.log("[ENV] DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("[ENV] ANTHROPIC_API_KEY set:", !!process.env.ANTHROPIC_API_KEY);
}

import express from "express";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── DB Helper ────────────────────────────────────────────────────────────────

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in .env.local");
  }
  return neon(connectionString);
}

let tablesInitialized = false;

async function ensureTables() {
  if (tablesInitialized) return;
  try {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    tablesInitialized = true;
  } catch (error) {
    console.error("Failed to ensure tables:", error);
  }
}

// ─── Mock Quiz ─────────────────────────────────────────────────────────────────

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

function generateMockQuiz(title: string, numQuestions: number): Question[] {
  const questions: Question[] = [];
  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question: `What is ${title} concept ${i}?`,
      options: [
        `Option A for ${title}`,
        `Option B for ${title}`,
        `Option C for ${title}`,
        `Option D for ${title}`,
      ],
      correct_answer: `Option A for ${title}`,
    });
  }
  return questions;
}

async function generateFromClaude(
  prompt: string,
  numQuestions: number
): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set — using mock quiz");
    return generateMockQuiz(prompt, numQuestions);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Generate a quiz with ${numQuestions} multiple choice questions about: "${prompt}"

Return ONLY a valid JSON array. Each question must have exactly this structure:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A"
  }
]

Rules:
- Each question must have exactly 4 options
- correct_answer must be one of the options
- Make questions clear and educational
- Difficulty: mix of easy, medium, and hard questions
- No markdown, no code blocks, ONLY JSON

Now generate the quiz:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", await response.json());
      return generateMockQuiz(prompt, numQuestions);
    }

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return generateMockQuiz(prompt, numQuestions);

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return generateMockQuiz(prompt, numQuestions);

    return parsed.filter(
      (q: any) =>
        q.question &&
        q.options &&
        Array.isArray(q.options) &&
        q.correct_answer &&
        q.options.includes(q.correct_answer)
    );
  } catch (error) {
    console.error("Claude API error:", error);
    return generateMockQuiz(prompt, numQuestions);
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, prompt, numQuestions } = rawBody || {};
    if (!type || !numQuestions || numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ error: "Invalid input" });
    }
    if (type === "prompt") {
      if (!prompt?.trim()) {
        return res.status(400).json({ error: "Prompt required" });
      }
      const questions = await generateFromClaude(prompt.trim(), Number(numQuestions));
      return res.json({ title: prompt, data: questions });
    }
    if (type === "image" || type === "pdf") {
      return res.status(400).json({ error: `${type} not yet implemented` });
    }
    return res.status(400).json({ error: "Invalid type" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/save-quiz", async (req, res) => {
  try {
    await ensureTables();
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { title, quizData } = rawBody || {};
    if (!title?.trim()) return res.status(400).json({ error: "Title required" });
    if (!quizData?.data || !Array.isArray(quizData.data)) {
      return res.status(400).json({ error: "Invalid quiz data" });
    }
    if (quizData.data.length === 0) {
      return res.status(400).json({ error: "Quiz must have questions" });
    }

    const id = randomUUID();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO quizzes (id, title, data)
      VALUES (${id}, ${title.trim()}, ${JSON.stringify({ data: quizData.data })})
      RETURNING *
    `;
    const row = rows[0];
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    return res.status(201).json({
      id: row.id,
      title: row.title,
      data: parsedData?.data || parsedData,
      createdAt: row.created_at,
    });
  } catch (error: any) {
    console.error("Error saving quiz:", error);
    return res.status(500).json({
      error: "Failed to save quiz",
      message: error?.message || "Unknown error",
    });
  }
});

app.get("/api/stored-quizzes", async (_req, res) => {
  try {
    await ensureTables();
    const sql = getSql();
    const rows = await sql`SELECT * FROM quizzes ORDER BY created_at DESC`;
    const quizzes = rows.map((row: any) => {
      const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {
        id: row.id,
        title: row.title,
        data: parsedData?.data || parsedData,
        createdAt: row.created_at,
      };
    });
    return res.json(quizzes);
  } catch (error: any) {
    console.error("Error retrieving quizzes:", error);
    return res.status(500).json({
      error: "Failed to retrieve quizzes",
      message: error?.message || "Unknown error",
    });
  }
});

app.delete("/api/delete-quiz/:quizId", async (req, res) => {
  try {
    await ensureTables();
    const { quizId } = req.params;
    if (!quizId) return res.status(400).json({ error: "Quiz ID required" });
    const sql = getSql();
    const rows = await sql`DELETE FROM quizzes WHERE id = ${quizId} RETURNING id`;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    return res.json({ message: "Quiz deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return res.status(500).json({
      error: "Failed to delete quiz",
      message: error?.message || "Unknown error",
    });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Local dev API server running on http://localhost:${PORT}`);
  console.log(`   Vite frontend should proxy /api/* requests here`);
});
