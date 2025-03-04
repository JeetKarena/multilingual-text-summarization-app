import { User, InsertUser, Summary, InsertSummary } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  createSummary(userId: number, summary: InsertSummary & { summary: string }): Promise<Summary>;
  getUserSummaries(userId: number): Promise<Summary[]>;
  deleteSummary(id: number, userId: number): Promise<boolean>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private summaries: Map<number, Summary>;
  private currentUserId: number;
  private currentSummaryId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.summaries = new Map();
    this.currentUserId = 1;
    this.currentSummaryId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const deleted = this.users.delete(id);
    // Also delete all user's summaries
    for (const [summaryId, summary] of this.summaries.entries()) {
      if (summary.userId === id) {
        this.summaries.delete(summaryId);
      }
    }
    return deleted;
  }

  async createSummary(userId: number, summary: InsertSummary & { summary: string }): Promise<Summary> {
    const id = this.currentSummaryId++;
    const newSummary: Summary = {
      id,
      userId,
      createdAt: new Date(),
      ...summary,
    };
    this.summaries.set(id, newSummary);
    return newSummary;
  }

  async getUserSummaries(userId: number): Promise<Summary[]> {
    return Array.from(this.summaries.values())
      .filter(summary => summary.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteSummary(id: number, userId: number): Promise<boolean> {
    const summary = this.summaries.get(id);
    if (!summary || summary.userId !== userId) {
      return false;
    }
    return this.summaries.delete(id);
  }
}

export const storage = new MemStorage();