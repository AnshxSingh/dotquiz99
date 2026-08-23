import { neon } from "@neondatabase/serverless";

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(connectionString);
}

let tablesInitialized = false;

export async function ensureTables(): Promise<void> {
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
    // Don't crash if already exists or permission denied
  }
}
