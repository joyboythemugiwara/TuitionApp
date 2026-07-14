import { db } from "@/database/client";
import { users, User } from "@/database/schemas/public/users";
import { tenants, Tenant } from "@/database/schemas/public/tenants";
import { sessions, NewSession, Session } from "@/database/schemas/public/sessions";
import { eq, and } from "drizzle-orm";
import { Repository } from "@/common/decorators";
import { migrateNewTenant } from "@/database/migrate-tenant";

@Repository()
export class AuthRepository {
  /**
   * Retrieves a user by their email address.
   */
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  /**
   * Retrieves a user by their ID.
   */
  async findUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  /**
   * Updates the FCM push notification token for a specific user.
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await db
      .update(users)
      .set({ fcmToken })
      .where(eq(users.id, userId));
  }

  /**
   * Updates a user's password hash
   */
  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  /**
   * Updates a user's active status (e.g. for email verification or accepting invites)
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId));
  }

  /**
   * Registers a new tenant and an admin user in a single transaction
   */
  async createTenantAndUser(tenantName: string, email: string, passwordHash: string, name: string): Promise<User> {
    return await db.transaction(async (tx) => {
      // 1. Create the tenant
      const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
      const [tenant] = await tx.insert(tenants).values({
        name: tenantName,
        slug,
        plan: "free",
      }).returning();

      // 2. Create the admin user
      const [user] = await tx.insert(users).values({
        tenantId: tenant.id,
        email,
        passwordHash,
        name,
        role: "admin",
        isActive: false, // Must verify email first
      }).returning();

      // 3. Create schema and apply tables for the new tenant
      try {
        await migrateNewTenant(tenant.id);
      } catch (err) {
        console.error("Failed to migrate new tenant schema", err);
        throw err;
      }

      return user;
    });
  }

  // --- Session Management ---

  async createSession(session: NewSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async findSessionById(sessionId: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
