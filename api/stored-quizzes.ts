import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
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
    const sql = neon(databaseUrl);

    // Auto-create table if needed
    await sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const rows = await sql`
      SELECT * FROM quizzes ORDER BY created_at DESC
    `;

    const quizzes = rows.map((row: any) => {
      const parsedData =
        typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {
        id: row.id,
        title: row.title,
        data: parsedData?.data || parsedData,
        createdAt: row.created_at,
      };
    });

    return res.status(200).json(quizzes);
  } catch (error: any) {
    console.error("Error retrieving quizzes:", error);
    return res.status(500).json({
      error: "Failed to retrieve quizzes",
      message: error?.message || "Unknown error",
    });
  }
}
