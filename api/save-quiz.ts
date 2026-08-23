import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getSql, ensureTables } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { title, quizData } = rawBody || {};

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

    await ensureTables();
    const sql = getSql();
    const id = randomUUID();
    const data = quizData.data;

    const rows = await sql`
      INSERT INTO quizzes (id, title, data)
      VALUES (${id}, ${title.trim()}, ${JSON.stringify({ data })})
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
      detail: String(error),
    });
  }
}
