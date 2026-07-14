import { db } from "./src/database/client";
import { sql } from "drizzle-orm";

async function resetDB() {
  console.log("Dropping all schemas...");
  
  // Get all schemas
  const result = await db.execute(sql.raw(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name = 'public' OR schema_name LIKE 'tenant_%';
  `));
  
  for (const row of result) {
    const schema = (row as any).schema_name;
    console.log(`Dropping schema: ${schema}`);
    await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`));
  }
  
  console.log("Recreating public schema...");
  await db.execute(sql.raw(`CREATE SCHEMA public;`));
  
  console.log("Database reset complete!");
  process.exit(0);
}

resetDB().catch((err) => {
  console.error(err);
  process.exit(1);
});
