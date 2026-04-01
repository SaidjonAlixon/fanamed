import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  console.log("Adding address and workplace columns...");
  try {
    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS address text');
    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS workplace text');
    console.log("Successfully added columns.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
