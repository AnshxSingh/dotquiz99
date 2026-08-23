import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool, ensureTables } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureTables();

    const { quizId } = req.query;

    if (!quizId || typeof quizId !== "string") {
      return res.status(400).json({ error: "Quiz ID is required" });
    }

    const pool = getPool();
    const result = await pool.query(
      "DELETE FROM quizzes WHERE id = $1",
      [quizId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return res.status(500).json({
      error: "Failed to delete quiz",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
