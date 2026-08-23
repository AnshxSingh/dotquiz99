import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({
      error: "DATABASE_URL environment variable is missing",
      help: "Add DATABASE_URL in Vercel Settings > Environment Variables and redeploy",
    });
  }

  try {
    const { quizId } = req.query;

    if (!quizId || typeof quizId !== "string") {
      return res.status(400).json({ error: "Quiz ID is required" });
    }

    const sql = neon(databaseUrl);
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
    });
  }
}
