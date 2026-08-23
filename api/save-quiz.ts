import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getPool, ensureTables } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureTables();

    const { title, quizData } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Quiz title is required" });
    }

    if (!quizData || !quizData.data || !Array.isArray(quizData.data)) {
      return res.status(400).json({
        error: "Invalid quiz data format. Must have 'data' array",
      });
    }

    if (quizData.data.length === 0) {
      return res.status(400).json({ error: "Quiz must have at least one question" });
    }

    for (let i = 0; i < quizData.data.length; i++) {
      const q = quizData.data[i];
      if (!q.question || !Array.isArray(q.options) || !q.correct_answer) {
        return res.status(400).json({
          error: `Question ${i + 1}: invalid format`,
        });
      }
    }

    const id = randomUUID();
    const data = quizData.data;

    const pool = getPool();
    const result = await pool.query(
      "INSERT INTO quizzes (id, title, data) VALUES ($1, $2, $3) RETURNING *",
      [id, title.trim(), JSON.stringify({ data })]
    );

    const row = result.rows[0];
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;

    return res.status(201).json({
      id: row.id,
      title: row.title,
      data: parsedData.data,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Error saving quiz:", error);
    return res.status(500).json({
      error: "Failed to save quiz",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
