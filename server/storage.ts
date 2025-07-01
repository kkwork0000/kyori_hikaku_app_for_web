import { users, userUsage, distanceQuery, articles, contacts, type User, type InsertUser, type UserUsage, type InsertUserUsage, type DistanceQuery, type InsertDistanceQuery, type Article, type InsertArticle, type Contact, type InsertContact } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count, lt } from "drizzle-orm";

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
  updateArticle(id: number, article: InsertArticle): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  updateArticleViews(id: number): Promise<void>;
  getPopularArticles(limit?: number): Promise<Article[]>;

  // Data cleanup operations
  cleanupOldUserUsage(): Promise<{ deletedCount: number }>;
  cleanupOldDistanceQueries(): Promise<{ deletedCount: number }>;
  getOldDataStats(): Promise<{
    oldUserUsageCount: number;
    oldDistanceQueryCount: number;
    totalUserUsageCount: number;
    totalDistanceQueryCount: number;
  }>;

  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getAllContacts(page?: number, limit?: number): Promise<{ contacts: Contact[], total: number }>;
  getContactById(id: number): Promise<Contact | undefined>;
  updateContactStatus(id: number, status: string): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  generateInquiryNumber(): string;
}

export class DatabaseStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserUsage(userId: string, month: string): Promise<UserUsage | undefined> {
    const [usage] = await db
      .select()
      .from(userUsage)
      .where(and(eq(userUsage.userId, userId), eq(userUsage.month, month)));
    return usage || undefined;
  }

  async createUserUsage(insertUsage: InsertUserUsage): Promise<UserUsage> {
    const [usage] = await db
      .insert(userUsage)
      .values(insertUsage)
      .returning();
    return usage;
  }

  async updateUserUsage(userId: string, month: string, usageCount: number): Promise<UserUsage> {
    const existing = await this.getUserUsage(userId, month);
    
    if (existing) {
      const [updated] = await db
        .update(userUsage)
        .set({ usageCount, lastUsed: new Date() })
        .where(and(eq(userUsage.userId, userId), eq(userUsage.month, month)))
        .returning();
      return updated;
    } else {
      return this.createUserUsage({ userId, month, usageCount });
    }
  }

  async getAllUserUsage(): Promise<UserUsage[]> {
    return await db.select().from(userUsage);
  }

  async createDistanceQuery(insertQuery: InsertDistanceQuery): Promise<DistanceQuery> {
    const [query] = await db
      .insert(distanceQuery)
      .values(insertQuery)
      .returning();
    return query;
  }

  async getDistanceQueries(userId: string): Promise<DistanceQuery[]> {
    return await db
      .select()
      .from(distanceQuery)
      .where(eq(distanceQuery.userId, userId));
  }

  async getTotalUsersCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(distinct ${userUsage.userId})` })
      .from(userUsage);
    return result[0]?.count || 0;
  }

  async getMonthlyQueriesCount(month: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`sum(${userUsage.usageCount})` })
      .from(userUsage)
      .where(eq(userUsage.month, month));
    return result[0]?.count || 0;
  }

  // Data cleanup operations
  async cleanupOldUserUsage(): Promise<{ deletedCount: number }> {
    // Calculate cutoff date (3 months ago)
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    // Delete records older than 3 months
    const result = await db
      .delete(userUsage)
      .where(sql`${userUsage.lastUsed} < ${cutoffDate}`)
      .returning({ id: userUsage.id });
    
    return { deletedCount: result.length };
  }

  async cleanupOldDistanceQueries(): Promise<{ deletedCount: number }> {
    // Calculate cutoff date (3 months ago)
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    // Delete records older than 3 months
    const result = await db
      .delete(distanceQuery)
      .where(sql`${distanceQuery.createdAt} < ${cutoffDate}`)
      .returning({ id: distanceQuery.id });
    
    return { deletedCount: result.length };
  }

  async getOldDataStats(): Promise<{
    oldUserUsageCount: number;
    oldDistanceQueryCount: number;
    totalUserUsageCount: number;
    totalDistanceQueryCount: number;
  }> {
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [oldUserUsage, oldDistanceQuery, totalUserUsage, totalDistanceQuery] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(userUsage)
        .where(sql`${userUsage.lastUsed} < ${cutoffDate}`),
      db.select({ count: sql<number>`count(*)` })
        .from(distanceQuery)
        .where(sql`${distanceQuery.createdAt} < ${cutoffDate}`),
      db.select({ count: sql<number>`count(*)` }).from(userUsage),
      db.select({ count: sql<number>`count(*)` }).from(distanceQuery)
    ]);

    return {
      oldUserUsageCount: oldUserUsage[0]?.count || 0,
      oldDistanceQueryCount: oldDistanceQuery[0]?.count || 0,
      totalUserUsageCount: totalUserUsage[0]?.count || 0,
      totalDistanceQueryCount: totalDistanceQuery[0]?.count || 0,
    };
  }

  // Article operations
  async getAllArticles(page: number = 1, limit: number = 10): Promise<{ articles: Article[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [articlesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(articles)
        .orderBy(desc(articles.views), desc(articles.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
    ]);

    return {
      articles: articlesResult,
      total: totalResult[0]?.count || 0
    };
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(insertArticle)
      .returning();
    return article;
  }

  async updateArticle(id: number, updateData: InsertArticle): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning({ id: articles.id });
    return result.length > 0;
  }

  async updateArticleViews(id: number): Promise<void> {
    await db
      .update(articles)
      .set({ 
        views: sql`${articles.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(articles.id, id));
  }

  async getPopularArticles(limit: number = 10): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .orderBy(desc(articles.views))
      .limit(limit);
  }

  // Contact operations
  generateInquiryNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INQ${timestamp}${random}`;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const inquiryNumber = this.generateInquiryNumber();
    const [contact] = await db
      .insert(contacts)
      .values({
        ...insertContact,
        inquiryNumber,
      })
      .returning();
    return contact;
  }

  async getAllContacts(page: number = 1, limit: number = 10): Promise<{ contacts: Contact[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [contactsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
    ]);

    return {
      contacts: contactsResult,
      total: totalResult[0]?.count || 0
    };
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async updateContactStatus(id: number, status: string): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();