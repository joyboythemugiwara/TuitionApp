import { db } from "./src/db";
import { users, students } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function check() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ email: u.email, tenantId: u.tenantId })));
  
  const allStudents = await db.select({ id: students.id, tenantId: students.tenantId }).from(students);
  console.log(`Total students: ${allStudents.length}`);
  if (allStudents.length > 0) {
    console.log("Sample student tenantId:", allStudents[0].tenantId);
  }
}
check();
