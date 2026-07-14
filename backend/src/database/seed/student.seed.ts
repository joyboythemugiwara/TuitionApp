import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";
import { students } from "@/database/schemas/tenant/students";
import { studentPhones } from "@/database/schemas/tenant/student-phones";
import { getTenantDb, getTenantSchemaName } from "@/database/client";
import { faker } from "@faker-js/faker/locale/en_IN";

export async function seedStudents(tenant: Tenant, batches: any[]) {
  seedLogger.info(`Seeding 100 Students for Tenant: ${tenant.name}...`);
  const tenantDb = getTenantDb(getTenantSchemaName(tenant.id));

  const insertedStudents = [];

  // We chunk it into 5 chunks of 20 to avoid transaction timeouts
  for (let i = 0; i < 5; i++) {
    await tenantDb.transaction(async (tx) => {
      const studentData = [];
      for (let j = 0; j < 20; j++) {
        // Pick random batch
        const randomBatch = batches[Math.floor(Math.random() * batches.length)];
        
        studentData.push({
          batchId: randomBatch.id,
          name: faker.person.fullName(),
          photoUrl: `/${tenant.id}/avatars/mock-${faker.string.uuid()}.jpg`,
          monthlyFee: randomBatch.defaultFee,
          feeStartDate: new Date(2026, 0, 1).toISOString(), // Jan 1, 2026
          status: "active" as const,
        });
      }

      const created = await tx.insert(students).values(studentData).returning();
      
      const phoneData = [];
      for (const st of created) {
        phoneData.push({
          studentId: st.id,
          number: faker.phone.number({ style: 'national' }),
          isPrimary: true,
          label: "father" as const
        });
        
        // 30% chance they have a secondary number
        if (Math.random() > 0.7) {
          phoneData.push({
            studentId: st.id,
            number: faker.phone.number({ style: 'national' }),
            isPrimary: false,
            label: "mother" as const
          });
        }
      }

      await tx.insert(studentPhones).values(phoneData);
      insertedStudents.push(...created);
    });
  }

  seedLogger.info(`Created ${insertedStudents.length} Students with Indian Phone Numbers`);
  return insertedStudents;
}
