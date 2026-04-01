import { db } from "./src/index";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Adding address and workplace columns...");
  try {
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS address text`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS workplace text`);
    console.log("Successfully added columns.");
    
    // Optional: remove photo_url if exists
    // await db.execute(sql`ALTER TABLE patients DROP COLUMN IF EXISTS photo_url`);
    // console.log("Successfully removed photo_url column.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
