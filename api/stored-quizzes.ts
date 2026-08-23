import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool, ensureTables } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureTables();

    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM quizzes ORDER BY created_at DESC"
    );

    const quizzes = result.rows.map((row) => {
      const parsedData =
        typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {
        id: row.id,
        title: row.title,
        data: parsedData.data,
        createdAt: row.created_at,
      };
    });

    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    return res.status(500).json({
      error: "Failed to retrieve quizzes",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
