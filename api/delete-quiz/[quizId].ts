import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, ensureTables } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { quizId } = req.query;

    if (!quizId || typeof quizId !== "string") {
      return res.status(400).json({ error: "Quiz ID is required" });
    }

    await ensureTables();
    const sql = getSql();
    const rows = await sql`
      DELETE FROM quizzes WHERE id = ${quizId} RETURNING id
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return res.status(500).json({
      error: "Failed to delete quiz",
      message: error?.message || "Unknown error",
      detail: String(error),
    });
  }
}
