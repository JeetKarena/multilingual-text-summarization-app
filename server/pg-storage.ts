import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { users, summaries } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { User, InsertUser, Summary, InsertSummary } from "@shared/schema";
import session from "express-session";
import pgSessionStore from "connect-pg-simple";
import { IStorage } from './storage';

const PgStore = pgSessionStore(session);

export class PostgresStorage implements IStorage {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.Store;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool);
    this.sessionStore = new PgStore({
      pool: this.pool,
      tableName: 'sessions'
    });
  }

  async initialize() {
    // Run migrations to ensure table structure is up to date
    // This assumes migrations have been generated with drizzle-kit
    await migrate(this.db, { migrationsFolder: './migrations' });
    console.log('Database migrations applied successfully');
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await this.db
      .update(users)
      .set({ ...updates, createdAt: undefined })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    // First delete user's summaries
    await this.db.delete(summaries).where(eq(summaries.userId, id));
    // Then delete the user
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async createSummary(userId: number, summary: InsertSummary & { summary: string }): Promise<Summary> {
    const result = await this.db
      .insert(summaries)
      .values({ ...summary, userId })
      .returning();
    return result[0];
  }

  async getUserSummaries(userId: number): Promise<Summary[]> {
    return this.db
      .select()
      .from(summaries)
      .where(eq(summaries.userId, userId))
      .orderBy(desc(summaries.createdAt));
  }

  async deleteSummary(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(summaries)
      .where(eq(summaries.id, id) && eq(summaries.userId, userId))
      .returning();
    return result.length > 0;
  }
}