import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, ensureTables } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureTables();
    const sql = getSql();
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
      detail: String(error),
    });
  }
}
