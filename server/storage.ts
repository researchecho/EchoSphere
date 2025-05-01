import { 
  users, 
  websites, 
  ecommerceStores, 
  products, 
  newsletterSubscribers, 
  contactMessages,
  type User, 
  type InsertUser,
  type Website,
  type InsertWebsite,
  type EcommerceStore,
  type InsertEcommerceStore,
  type Product,
  type InsertProduct,
  type NewsletterSubscriber,
  type ContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, like, desc, sql, SQL, asc } from "drizzle-orm";

// Common interface for pagination and filtering
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(options?: QueryOptions): Promise<{ users: User[], total: number }>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Website methods
  getWebsite(id: number): Promise<Website | undefined>;
  getWebsites(options?: QueryOptions): Promise<{ websites: Website[], total: number }>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: number, data: Partial<InsertWebsite>): Promise<Website | undefined>;
  deleteWebsite(id: number): Promise<boolean>;
  
  // E-commerce store methods
  getStore(id: number): Promise<EcommerceStore | undefined>;
  getStores(options?: QueryOptions): Promise<{ stores: EcommerceStore[], total: number }>;
  createStore(store: InsertEcommerceStore): Promise<EcommerceStore>;
  updateStore(id: number, data: Partial<InsertEcommerceStore>): Promise<EcommerceStore | undefined>;
  deleteStore(id: number): Promise<boolean>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(options?: QueryOptions): Promise<{ products: Product[], total: number }>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Newsletter subscriber methods
  getSubscriber(id: number): Promise<NewsletterSubscriber | undefined>;
  getSubscribers(options?: QueryOptions): Promise<{ subscribers: NewsletterSubscriber[], total: number }>;
  updateSubscriber(id: number, data: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | undefined>;
  deleteSubscriber(id: number): Promise<boolean>;
  
  // Contact message methods
  getMessage(id: number): Promise<ContactMessage | undefined>;
  getMessages(options?: QueryOptions): Promise<{ messages: ContactMessage[], total: number }>;
  updateMessage(id: number, data: Partial<ContactMessage>): Promise<ContactMessage | undefined>;
  deleteMessage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Helper method for applying query options
  private applyQueryOptions<T>(
    baseQuery: any,
    table: any,
    options?: QueryOptions
  ): any {
    let query = baseQuery;
    
    // Apply search if provided
    if (options?.search && options.searchFields && options.searchFields.length > 0) {
      const searchConditions: SQL[] = [];
      
      for (const field of options.searchFields) {
        if (table[field]) {
          searchConditions.push(like(table[field], `%${options.search}%`));
        }
      }
      
      if (searchConditions.length > 0) {
        const searchCondition = searchConditions.reduce((acc, condition) => sql`${acc} OR ${condition}`);
        query = query.where(searchCondition);
      }
    }
    
    // Apply filters if provided
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (table[key] && value !== undefined && value !== null) {
          query = query.where(eq(table[key], value));
        }
      }
    }
    
    // Apply sorting if provided
    if (options?.sortBy && table[options.sortBy]) {
      const orderFunc = options.sortOrder === 'asc' ? asc : desc;
      query = query.orderBy(orderFunc(table[options.sortBy]));
    }
    
    // Apply pagination if provided
    if (options?.page !== undefined && options?.limit !== undefined) {
      const offset = (options.page - 1) * options.limit;
      query = query.limit(options.limit).offset(offset);
    }
    
    return query;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUsers(options?: QueryOptions): Promise<{ users: User[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(users), users, options);
    const result = await query;
    
    return { users: result, total: Number(count) };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
      
    return result.length > 0;
  }
  
  // Website methods
  async getWebsite(id: number): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.id, id));
    return website || undefined;
  }
  
  async getWebsites(options?: QueryOptions): Promise<{ websites: Website[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(websites);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(websites), websites, options);
    const result = await query;
    
    return { websites: result, total: Number(count) };
  }
  
  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const [website] = await db
      .insert(websites)
      .values(insertWebsite)
      .returning();
    return website;
  }
  
  async updateWebsite(id: number, data: Partial<InsertWebsite>): Promise<Website | undefined> {
    const [updatedWebsite] = await db
      .update(websites)
      .set(data)
      .where(eq(websites.id, id))
      .returning();
      
    return updatedWebsite;
  }
  
  async deleteWebsite(id: number): Promise<boolean> {
    const result = await db
      .delete(websites)
      .where(eq(websites.id, id))
      .returning({ id: websites.id });
      
    return result.length > 0;
  }
  
  // E-commerce store methods
  async getStore(id: number): Promise<EcommerceStore | undefined> {
    const [store] = await db.select().from(ecommerceStores).where(eq(ecommerceStores.id, id));
    return store || undefined;
  }
  
  async getStores(options?: QueryOptions): Promise<{ stores: EcommerceStore[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ecommerceStores);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(ecommerceStores), ecommerceStores, options);
    const result = await query;
    
    return { stores: result, total: Number(count) };
  }
  
  async createStore(insertStore: InsertEcommerceStore): Promise<EcommerceStore> {
    const [store] = await db
      .insert(ecommerceStores)
      .values(insertStore)
      .returning();
    return store;
  }
  
  async updateStore(id: number, data: Partial<InsertEcommerceStore>): Promise<EcommerceStore | undefined> {
    const [updatedStore] = await db
      .update(ecommerceStores)
      .set(data)
      .where(eq(ecommerceStores.id, id))
      .returning();
      
    return updatedStore;
  }
  
  async deleteStore(id: number): Promise<boolean> {
    const result = await db
      .delete(ecommerceStores)
      .where(eq(ecommerceStores.id, id))
      .returning({ id: ecommerceStores.id });
      
    return result.length > 0;
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }
  
  async getProducts(options?: QueryOptions): Promise<{ products: Product[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(products), products, options);
    const result = await query;
    
    return { products: result, total: Number(count) };
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }
  
  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
      
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
      
    return result.length > 0;
  }
  
  // Newsletter subscriber methods
  async getSubscriber(id: number): Promise<NewsletterSubscriber | undefined> {
    const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    return subscriber || undefined;
  }
  
  async getSubscribers(options?: QueryOptions): Promise<{ subscribers: NewsletterSubscriber[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(newsletterSubscribers), newsletterSubscribers, options);
    const result = await query;
    
    return { subscribers: result, total: Number(count) };
  }
  
  async updateSubscriber(id: number, data: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | undefined> {
    const [updatedSubscriber] = await db
      .update(newsletterSubscribers)
      .set(data)
      .where(eq(newsletterSubscribers.id, id))
      .returning();
      
    return updatedSubscriber;
  }
  
  async deleteSubscriber(id: number): Promise<boolean> {
    const result = await db
      .delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .returning({ id: newsletterSubscribers.id });
      
    return result.length > 0;
  }
  
  // Contact message methods
  async getMessage(id: number): Promise<ContactMessage | undefined> {
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return message || undefined;
  }
  
  async getMessages(options?: QueryOptions): Promise<{ messages: ContactMessage[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages);
    
    // Apply query options
    const query = this.applyQueryOptions(db.select().from(contactMessages), contactMessages, options);
    const result = await query;
    
    return { messages: result, total: Number(count) };
  }
  
  async updateMessage(id: number, data: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set(data)
      .where(eq(contactMessages.id, id))
      .returning();
      
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id });
      
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
