import { users, userUsage, distanceQuery, articles, type User, type InsertUser, type UserUsage, type InsertUserUsage, type DistanceQuery, type InsertDistanceQuery, type Article, type InsertArticle } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getUserUsage(userId: string, month: string): Promise<UserUsage | undefined>;
  createUserUsage(usage: InsertUserUsage): Promise<UserUsage>;
  updateUserUsage(userId: string, month: string, usageCount: number): Promise<UserUsage>;
  getAllUserUsage(): Promise<UserUsage[]>;
  
  createDistanceQuery(query: InsertDistanceQuery): Promise<DistanceQuery>;
  getDistanceQueries(userId: string): Promise<DistanceQuery[]>;
  getTotalUsersCount(): Promise<number>;
  getMonthlyQueriesCount(month: string): Promise<number>;

  // Article operations
  getAllArticles(page?: number, limit?: number): Promise<{ articles: Article[], total: number }>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticleViews(id: number): Promise<void>;
  getPopularArticles(limit?: number): Promise<Article[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userUsages: Map<string, UserUsage>;
  private distanceQueries: Map<number, DistanceQuery>;
  private currentUserId: number;
  private currentUsageId: number;
  private currentQueryId: number;

  constructor() {
    this.users = new Map();
    this.userUsages = new Map();
    this.distanceQueries = new Map();
    this.currentUserId = 1;
    this.currentUsageId = 1;
    this.currentQueryId = 1;
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

  async getUserUsage(userId: string, month: string): Promise<UserUsage | undefined> {
    const key = `${userId}_${month}`;
    return this.userUsages.get(key);
  }

  async createUserUsage(insertUsage: InsertUserUsage): Promise<UserUsage> {
    const id = this.currentUsageId++;
    const usage: UserUsage = { 
      ...insertUsage, 
      id,
      lastUsed: new Date()
    };
    const key = `${usage.userId}_${usage.month}`;
    this.userUsages.set(key, usage);
    return usage;
  }

  async updateUserUsage(userId: string, month: string, usageCount: number): Promise<UserUsage> {
    const key = `${userId}_${month}`;
    const existing = this.userUsages.get(key);
    
    if (existing) {
      const updated: UserUsage = {
        ...existing,
        usageCount,
        lastUsed: new Date()
      };
      this.userUsages.set(key, updated);
      return updated;
    } else {
      return this.createUserUsage({ userId, month, usageCount });
    }
  }

  async getAllUserUsage(): Promise<UserUsage[]> {
    return Array.from(this.userUsages.values());
  }

  async createDistanceQuery(insertQuery: InsertDistanceQuery): Promise<DistanceQuery> {
    const id = this.currentQueryId++;
    const query: DistanceQuery = {
      ...insertQuery,
      id,
      createdAt: new Date()
    };
    this.distanceQueries.set(id, query);
    return query;
  }

  async getDistanceQueries(userId: string): Promise<DistanceQuery[]> {
    return Array.from(this.distanceQueries.values()).filter(
      query => query.userId === userId
    );
  }

  async getTotalUsersCount(): Promise<number> {
    return new Set(Array.from(this.userUsages.values()).map(u => u.userId)).size;
  }

  async getMonthlyQueriesCount(month: string): Promise<number> {
    return Array.from(this.userUsages.values())
      .filter(usage => usage.month === month)
      .reduce((total, usage) => total + usage.usageCount, 0);
  }
}

export const storage = new MemStorage();
