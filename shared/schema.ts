import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, jsonb, primaryKey, date, time, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Websites table
export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  domain: text("domain"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const websitesRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
}));

// E-commerce stores table
export const ecommerceStores = pgTable("ecommerce_stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ecommerceStoresRelations = relations(ecommerceStores, ({ one }) => ({
  user: one(users, {
    fields: [ecommerceStores.userId],
    references: [users.id],
  }),
}));

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => ecommerceStores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // stored in cents
  inventory: integer("inventory").default(0),
  imageUrl: text("image_url"),
  sku: text("sku"),
  weight: real("weight"),
  dimensions: jsonb("dimensions"), // {length, width, height}
  categories: text("categories").array(),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product variants
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  price: integer("price").notNull(), // stored in cents
  inventory: integer("inventory").default(0),
  attributes: jsonb("attributes").notNull(), // {color: "red", size: "XL", etc}
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  guestId: text("guest_id"), // For non-logged in users
  storeId: integer("store_id").references(() => ecommerceStores.id).notNull(),
  status: text("status").default("active").notNull(), // active, abandoned, converted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").default(1).notNull(),
  price: integer("price").notNull(), // Price at the time of adding to cart
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  storeId: integer("store_id").references(() => ecommerceStores.id).notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, cancelled, refunded
  currency: text("currency").default("USD").notNull(),
  subtotal: integer("subtotal").notNull(), // stored in cents
  tax: integer("tax").default(0).notNull(), // stored in cents
  shipping: integer("shipping").default(0).notNull(), // stored in cents
  discount: integer("discount").default(0).notNull(), // stored in cents
  total: integer("total").notNull(), // stored in cents
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  billingAddress: jsonb("billing_address").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, failed
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  name: text("name").notNull(),
  sku: text("sku"),
  price: integer("price").notNull(), // stored in cents
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(), // stored in cents
  metadata: jsonb("metadata"),
});

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  status: text("status").default("active").notNull(),
});

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("unread").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertWebsiteSchema = createInsertSchema(websites).pick({
  userId: true,
  name: true,
  domain: true,
  settings: true,
});

export const insertEcommerceStoreSchema = createInsertSchema(ecommerceStores).pick({
  userId: true,
  name: true,
  description: true,
  settings: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  storeId: true,
  name: true,
  description: true,
  price: true,
  inventory: true,
  imageUrl: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).pick({
  email: true,
  name: true,
  status: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  message: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websites.$inferSelect;

export type InsertEcommerceStore = z.infer<typeof insertEcommerceStoreSchema>;
export type EcommerceStore = typeof ecommerceStores.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Blog and CMS tables
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  status: text("status").default("draft").notNull(), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
});

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => blogCategories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogPostCategories = pgTable("blog_post_categories", {
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  categoryId: integer("category_id").references(() => blogCategories.id).notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.postId, table.categoryId] }),
}));

export const blogPostTags = pgTable("blog_post_tags", {
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  tagId: integer("tag_id").references(() => blogTags.id).notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id").references(() => blogComments.id),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, spam
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  status: text("status").default("draft").notNull(), // draft, published, archived
  template: text("template").default("default").notNull(),
  order: integer("order").default(0),
  parentId: integer("parent_id").references(() => pages.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
});

// Social Network Tables
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  location: text("location"),
  website: text("website"),
  socialLinks: jsonb("social_links"), // {twitter, facebook, linkedin, etc}
  preferences: jsonb("preferences"),
  privacySettings: jsonb("privacy_settings"),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followedId: integer("followed_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  uniqueConstraint: unique({ columns: [table.followerId, table.followedId] }),
}));

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  isPrivate: boolean("is_private").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member").notNull(), // admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => groups.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  parentId: integer("parent_id").references(() => comments.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => posts.id),
  commentId: integer("comment_id").references(() => comments.id),
  type: text("type").notNull(), // like, love, laugh, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  postConstraint: unique({ columns: [table.userId, table.postId] }),
  commentConstraint: unique({ columns: [table.userId, table.commentId] }),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  type: text("type").default("direct").notNull(), // direct, group
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member").notNull(), // creator, admin, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReadMessageId: integer("last_read_message_id").references(() => messages.id),
}, table => ({
  uniqueConstraint: unique({ columns: [table.conversationId, table.userId] }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  isSystem: boolean("is_system").default(false),
  isEdited: boolean("is_edited").default(false),
  readBy: integer("read_by").array(), // Array of user IDs who have read the message
  reactions: jsonb("reactions"), // {userId: reaction_type}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // follow, mention, comment, reaction, etc
  actorId: integer("actor_id").references(() => users.id), // Who triggered the notification
  targetId: integer("target_id"), // Generic ID for the target (post, comment, etc)
  targetType: text("target_type"), // Type of the target (post, comment, etc)
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations after all tables are defined
export const usersRelations = relations(users, ({ many, one }) => ({
  websites: many(websites),
  ecommerceStores: many(ecommerceStores),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
  pages: many(pages),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  groups: many(groupMembers),
  groupsCreated: many(groups, { relationName: "createdGroups" }),
  posts: many(posts),
  comments: many(comments),
  reactions: many(reactions),
  conversations: many(conversationParticipants),
  messages: many(messages),
  notifications: many(notifications),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(ecommerceStores, {
    fields: [products.storeId],
    references: [ecommerceStores.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  website: one(websites, {
    fields: [blogPosts.websiteId],
    references: [websites.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  categories: many(blogPostCategories),
  tags: many(blogPostTags),
  comments: many(blogComments),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ one, many }) => ({
  website: one(websites, {
    fields: [blogCategories.websiteId],
    references: [websites.id],
  }),
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
  }),
  children: many(blogCategories),
  posts: many(blogPostCategories),
}));

export const blogTagsRelations = relations(blogTags, ({ one, many }) => ({
  website: one(websites, {
    fields: [blogTags.websiteId],
    references: [websites.id],
  }),
  posts: many(blogPostTags),
}));

export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostCategories.postId],
    references: [blogPosts.id],
  }),
  category: one(blogCategories, {
    fields: [blogPostCategories.categoryId],
    references: [blogCategories.id],
  }),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
  }),
  replies: many(blogComments),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  website: one(websites, {
    fields: [pages.websiteId],
    references: [websites.id],
  }),
  author: one(users, {
    fields: [pages.authorId],
    references: [users.id],
  }),
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
  }),
  children: many(pages),
}));

// AI Omnilayer System
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // openai, anthropic, etc
  modelId: text("model_id").notNull(), // openai model id: gpt-4-turbo
  capabilities: text("capabilities").array(), // text, image, audio, etc
  contextLength: integer("context_length").notNull(),
  isActive: boolean("is_active").default(true),
  pricing: jsonb("pricing"), // {input_tokens_per_dollar, output_tokens_per_dollar}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiAgents = pgTable("ai_agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  modelId: integer("model_id").references(() => aiModels.id).notNull(),
  functions: jsonb("functions"),
  isPublic: boolean("is_public").default(false),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiWorkflows = pgTable("ai_workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(), // [{type, agentId, params, next_steps}]
  inputSchema: jsonb("input_schema"),
  outputSchema: jsonb("output_schema"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  agentId: integer("agent_id").references(() => aiAgents.id).notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => aiConversations.id).notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI relations
export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  agents: many(aiAgents),
}));

export const aiAgentsRelations = relations(aiAgents, ({ one, many }) => ({
  user: one(users, {
    fields: [aiAgents.userId],
    references: [users.id],
  }),
  model: one(aiModels, {
    fields: [aiAgents.modelId],
    references: [aiModels.id],
  }),
  conversations: many(aiConversations),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  agent: one(aiAgents, {
    fields: [aiConversations.agentId],
    references: [aiAgents.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

// Social Network
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => socialGroups.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // {images, videos, polls, etc}
  isPublic: boolean("is_public").default(true),
  ageRestricted: boolean("age_restricted").default(false),
  minimumAge: integer("minimum_age"),
  parentalControlLevel: text("parental_control_level"), // low, medium, high
  viewCount: integer("view_count").default(0),
  shareCount: integer("share_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialGroups = pgTable("social_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  isPrivate: boolean("is_private").default(false),
  ageRestricted: boolean("age_restricted").default(false),
  minimumAge: integer("minimum_age"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  settings: jsonb("settings"),
  membershipApproval: text("membership_approval").default("automatic").notNull(), // automatic, manual
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialGroupMembers = pgTable("social_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => socialGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member").notNull(), // admin, moderator, member
  status: text("status").default("active").notNull(), // active, banned, muted
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, table => ({
  uniqueMember: unique({ columns: [table.groupId, table.userId] }),
}));

export const socialComments = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => socialPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  parentId: integer("parent_id").references(() => socialComments.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  ageRestricted: boolean("age_restricted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialReactions = pgTable("social_reactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => socialPosts.id),
  commentId: integer("comment_id").references(() => socialComments.id),
  type: text("type").notNull(), // like, love, laugh, angry, sad, wow
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  postConstraint: unique({ columns: [table.userId, table.postId, table.type] }),
  commentConstraint: unique({ columns: [table.userId, table.commentId, table.type] }),
}));

export const socialFriendships = pgTable("social_friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  friendId: integer("friend_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => ({
  uniqueFriendship: unique({ columns: [table.userId, table.friendId] }),
}));

export const socialMessages = pgTable("social_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  read: boolean("read").default(false),
  ageRestricted: boolean("age_restricted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for social tables
export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id],
  }),
  group: one(socialGroups, {
    fields: [socialPosts.groupId],
    references: [socialGroups.id],
  }),
  comments: many(socialComments),
  reactions: many(socialReactions),
}));

export const socialGroupsRelations = relations(socialGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [socialGroups.createdById],
    references: [users.id],
  }),
  members: many(socialGroupMembers),
  posts: many(socialPosts),
}));

export const socialCommentsRelations = relations(socialComments, ({ one, many }) => ({
  post: one(socialPosts, {
    fields: [socialComments.postId],
    references: [socialPosts.id],
  }),
  user: one(users, {
    fields: [socialComments.userId],
    references: [users.id],
  }),
  parent: one(socialComments, {
    fields: [socialComments.parentId],
    references: [socialComments.id],
  }),
  replies: many(socialComments, { relationName: 'replies' }),
  reactions: many(socialReactions),
}));

// Educational Portal
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Creator
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  coverImage: text("cover_image"),
  price: integer("price"), // In cents, null means free
  status: text("status").default("draft").notNull(), // draft, published, archived
  level: text("level").default("beginner").notNull(), // beginner, intermediate, advanced
  duration: integer("duration"), // In minutes
  prerequisites: text("prerequisites").array(),
  learningObjectives: text("learning_objectives").array(),
  allowKids: boolean("allow_kids").default(false),
  ageRange: jsonb("age_range"), // {min, max}
  parentalControlLevel: text("parental_control_level").default("low"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => courseModules.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  duration: integer("duration"), // In minutes
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  progress: integer("progress").default(0), // Percentage
  status: text("status").default("active").notNull(), // active, completed, abandoned
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  completionDate: timestamp("completion_date"),
});

export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => courseEnrollments.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  status: text("status").default("not_started").notNull(), // not_started, in_progress, completed
  completionDate: timestamp("completion_date"),
  timeSpent: integer("time_spent").default(0), // In seconds
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").default(70), // Percentage
  timeLimit: integer("time_limit"), // In minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  content: text("content").notNull(),
  type: text("type").default("multiple_choice").notNull(), // multiple_choice, true_false, short_answer
  points: integer("points").default(1),
  order: integer("order").default(0),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => quizQuestions.id).notNull(),
  content: text("content").notNull(),
  isCorrect: boolean("is_correct").default(false),
  explanation: text("explanation"),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score"), // Percentage
  status: text("status").default("in_progress").notNull(), // in_progress, completed
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
});

export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => quizAttempts.id).notNull(),
  questionId: integer("question_id").references(() => quizQuestions.id).notNull(),
  answerId: integer("answer_id").references(() => quizAnswers.id),
  textResponse: text("text_response"), // For short answer questions
  isCorrect: boolean("is_correct"),
  points: integer("points").default(0),
});

// CRM + Marketing
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  source: text("source"), // How they were acquired
  status: text("status").default("lead").notNull(), // lead, prospect, customer, etc
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastContactedAt: timestamp("last_contacted_at"),
});

export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contactId: integer("contact_id").references(() => crmContacts.id).notNull(),
  name: text("name").notNull(),
  value: integer("value").notNull(), // In cents
  stage: text("stage").default("lead").notNull(), // lead, qualified, proposal, negotiation, closed_won, closed_lost
  probability: integer("probability").default(0), // Percentage
  expectedCloseDate: date("expected_close_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const crmActivities = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contactId: integer("contact_id").references(() => crmContacts.id),
  dealId: integer("deal_id").references(() => crmDeals.id),
  type: text("type").notNull(), // call, email, meeting, task, note
  subject: text("subject").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // email, social, search, display
  status: text("status").default("draft").notNull(), // draft, active, paused, completed
  budget: integer("budget"), // In cents
  startDate: date("start_date"),
  endDate: date("end_date"),
  goals: jsonb("goals"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingEmails = pgTable("marketing_emails", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  template: text("template"),
  status: text("status").default("draft").notNull(), // draft, scheduled, sent
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailLists = pgTable("email_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailListContacts = pgTable("email_list_contacts", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => emailLists.id).notNull(),
  contactId: integer("contact_id").references(() => crmContacts.id).notNull(),
  status: text("status").default("subscribed").notNull(), // subscribed, unsubscribed, bounced
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const emailCampaignLists = pgTable("email_campaign_lists", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  listId: integer("list_id").references(() => emailLists.id).notNull(),
});

export const emailStats = pgTable("email_stats", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => marketingEmails.id).notNull(),
  contactId: integer("contact_id").references(() => crmContacts.id).notNull(),
  sent: boolean("sent").default(false),
  delivered: boolean("delivered").default(false),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
  bounced: boolean("bounced").default(false),
  unsubscribed: boolean("unsubscribed").default(false),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Marketplace
export const marketplace_categories = pgTable("marketplace_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references(() => marketplace_categories.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketplace_items = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: integer("price"), // In cents, null means free
  type: text("type").notNull(), // plugin, template, ai_agent, digital_good
  status: text("status").default("draft").notNull(), // draft, pending_review, published, rejected
  featuredImage: text("featured_image"),
  galleryImages: text("gallery_images").array(),
  version: text("version").default("1.0.0"),
  requirements: jsonb("requirements"),
  supportInfo: jsonb("support_info"),
  rating: real("rating"),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const marketplace_item_categories = pgTable("marketplace_item_categories", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => marketplace_items.id).notNull(),
  categoryId: integer("category_id").references(() => marketplace_categories.id).notNull(),
});

export const marketplace_purchases = pgTable("marketplace_purchases", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => marketplace_items.id).notNull(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  price: integer("price").notNull(), // In cents
  status: text("status").default("completed").notNull(), // completed, refunded
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  refundDate: timestamp("refund_date"),
});

export const marketplace_reviews = pgTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => marketplace_items.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job Listings
export const jobListings = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Employer
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  isRemote: boolean("is_remote").default(false),
  type: text("type").notNull(), // full_time, part_time, contract, internship
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  salary: jsonb("salary"), // {min, max, currency, period}
  applicationUrl: text("application_url"),
  applicationEmail: text("application_email"),
  status: text("status").default("active").notNull(), // active, filled, expired
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobListings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  status: text("status").default("submitted").notNull(), // submitted, reviewed, interview, rejected, accepted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Booking Systems
export const bookingServices = pgTable("booking_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Service provider
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // In minutes
  price: integer("price").notNull(), // In cents
  color: text("color"),
  bufferTimeBefore: integer("buffer_time_before").default(0), // In minutes
  bufferTimeAfter: integer("buffer_time_after").default(0), // In minutes
  maxAttendees: integer("max_attendees").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookingAvailability = pgTable("booking_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Service provider
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
});

export const bookingBlackoutDates = pgTable("booking_blackout_dates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Service provider
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingAppointments = pgTable("booking_appointments", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => bookingServices.id).notNull(),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => users.id),
  clientName: text("client_name"), // For non-registered users
  clientEmail: text("client_email"), // For non-registered users
  clientPhone: text("client_phone"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  notes: text("notes"),
  status: text("status").default("confirmed").notNull(), // confirmed, cancelled, completed, no_show
  cancellationReason: text("cancellation_reason"),
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events 
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Organizer
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  isOnline: boolean("is_online").default(false),
  onlineUrl: text("online_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  maxAttendees: integer("max_attendees"),
  price: integer("price"), // In cents, null means free
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").default(true),
  status: text("status").default("scheduled").notNull(), // scheduled, cancelled, completed
  recurrence: jsonb("recurrence"), // For recurring events
  aiSummary: text("ai_summary"), // AI-generated summary
  calendarProvider: text("calendar_provider"), // google, outlook, etc
  calendarEventId: text("calendar_event_id"), // External calendar ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events AI suggestions
export const eventSuggestions = pgTable("event_suggestions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  suggestedStartTime: timestamp("suggested_start_time").notNull(),
  suggestedEndTime: timestamp("suggested_end_time").notNull(),
  reason: text("reason").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  attendeeName: text("attendee_name"), // For non-registered users
  attendeeEmail: text("attendee_email"), // For non-registered users
  attendeeCount: integer("attendee_count").default(1),
  status: text("status").default("registered").notNull(), // registered, cancelled, attended
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Developer APIs
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(), // Hashed
  scopes: text("scopes").array(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiRequests = pgTable("api_requests", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  method: text("method").notNull(), // GET, POST, etc.
  path: text("path").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // In milliseconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull(), // user.created, order.completed, etc.
  isActive: boolean("is_active").default(true),
  secret: text("secret").notNull(), // For signature verification
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").references(() => webhooks.id).notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  error: text("error"),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mobile App Authentication
export const mobileDevices = pgTable("mobile_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  platform: text("platform").notNull(), // ios, android
  pushToken: text("push_token"),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
