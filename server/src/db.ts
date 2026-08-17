import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/rentals_finance",
});

export async function initDb(): Promise<void> {
  const schema = readFileSync(join(__dirname, "../schema.sql"), "utf8");
  await pool.query(schema);
}
