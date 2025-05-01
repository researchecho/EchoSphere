import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  newsletterSubscribers, 
  contactMessages,
  users,
  websites,
  ecommerceStores,
  products,
  insertNewsletterSubscriberSchema,
  insertContactMessageSchema,
  insertUserSchema,
  insertWebsiteSchema,
  insertEcommerceStoreSchema,
  insertProductSchema
} from "@shared/schema";
import { z } from "zod";
import { AIService } from "./services/aiService";
import { SocialService } from "./services/socialService";

// Initialize services
const aiService = new AIService();
const socialService = new SocialService();

// Helper for sending a standardized API response
function sendApiResponse(
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data?: any
) {
  return res.status(status).json({
    success,
    message,
    ...(data && { data })
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse query parameters for pagination, sorting, and filtering
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.query) {
      // Add parsed parameters to req object directly
      (req as any).parsedQuery = {
        page: req.query.page ? parseInt(req.query.page as string) || 1 : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) || 10 : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
      };
      
      // Parse filters if provided as JSON string
      if (req.query.filters && typeof req.query.filters === 'string') {
        try {
          (req as any).parsedQuery.filters = JSON.parse(req.query.filters);
        } catch (e) {
          (req as any).parsedQuery.filters = {};
        }
      }
      
      // Set default sort order
      if ((req as any).parsedQuery.sortBy && !(req as any).parsedQuery.sortOrder) {
        (req as any).parsedQuery.sortOrder = 'desc';
      }
    }
    next();
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    return sendApiResponse(res, 500, false, 'Internal server error');
  });

  // ================== AUTH ROUTES ==================
  
  // User registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      if (!username || !password || !email) {
        return sendApiResponse(res, 400, false, 'Username, password, and email are required');
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return sendApiResponse(res, 400, false, 'Username already taken');
      }
      
      // In a production app, we would hash the password here
      // using bcrypt or a similar library
      
      // Create the user
      const user = await storage.createUser({
        username,
        password, // NOTE: In a real app, this would be hashed
        email,
        fullName: fullName || null,
        role: 'user'
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return sendApiResponse(res, 201, true, 'User registered successfully', { user: userWithoutPassword });
    } catch (error: any) {
      console.error('User registration error:', error);
      return sendApiResponse(res, 500, false, 'An error occurred during registration');
    }
  });
  
  // User login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return sendApiResponse(res, 400, false, 'Username and password are required');
      }
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return sendApiResponse(res, 401, false, 'Invalid username or password');
      }
      
      // Check password (in a real app, we would use bcrypt.compare)
      if (user.password !== password) {
        return sendApiResponse(res, 401, false, 'Invalid username or password');
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return sendApiResponse(res, 200, true, 'Login successful', { user: userWithoutPassword });
    } catch (error: any) {
      console.error('Login error:', error);
      return sendApiResponse(res, 500, false, 'An error occurred during login');
    }
  });

  // ================== USER ROUTES ==================
  
  // Get all users with pagination, filtering, and sorting
  app.get('/api/users', async (req, res) => {
    try {
      const queryOptions = (req as any).parsedQuery || {};
      
      const { users, total } = await storage.getUsers(queryOptions);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return sendApiResponse(res, 200, true, 'Users retrieved successfully', { 
        users: usersWithoutPasswords, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get users error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve users');
    }
  });
  
  // Get a specific user
  app.get('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid user ID');
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return sendApiResponse(res, 404, false, 'User not found');
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return sendApiResponse(res, 200, true, 'User retrieved successfully', { user: userWithoutPassword });
    } catch (error) {
      console.error('Get user error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve user');
    }
  });
  
  // Update a user
  app.patch('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid user ID');
      }
      
      // Validate update data
      const updateSchema = insertUserSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return sendApiResponse(res, 404, false, 'User not found');
      }
      
      const updatedUser = await storage.updateUser(id, parseResult.data);
      if (!updatedUser) {
        return sendApiResponse(res, 500, false, 'Failed to update user');
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return sendApiResponse(res, 200, true, 'User updated successfully', { user: userWithoutPassword });
    } catch (error) {
      console.error('Update user error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update user');
    }
  });
  
  // Delete a user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid user ID');
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return sendApiResponse(res, 404, false, 'User not found');
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete user');
      }
      
      return sendApiResponse(res, 200, true, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete user');
    }
  });

  // ================== WEBSITE ROUTES ==================
  
  // Get all websites with pagination, filtering, and sorting
  app.get('/api/websites', async (req, res) => {
    try {
      const queryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
        filters: req.query.filters as Record<string, any> | undefined
      };
      
      const { websites, total } = await storage.getWebsites(queryOptions);
      
      return sendApiResponse(res, 200, true, 'Websites retrieved successfully', { 
        websites, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get websites error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve websites');
    }
  });
  
  // Get a specific website
  app.get('/api/websites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid website ID');
      }
      
      const website = await storage.getWebsite(id);
      if (!website) {
        return sendApiResponse(res, 404, false, 'Website not found');
      }
      
      return sendApiResponse(res, 200, true, 'Website retrieved successfully', { website });
    } catch (error) {
      console.error('Get website error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve website');
    }
  });
  
  // Create a new website
  app.post('/api/websites', async (req, res) => {
    try {
      // Validate data
      const parseResult = insertWebsiteSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(parseResult.data.userId);
      if (!user) {
        return sendApiResponse(res, 400, false, 'User not found');
      }
      
      const website = await storage.createWebsite(parseResult.data);
      
      return sendApiResponse(res, 201, true, 'Website created successfully', { website });
    } catch (error) {
      console.error('Create website error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create website');
    }
  });
  
  // Update a website
  app.patch('/api/websites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid website ID');
      }
      
      // Validate update data
      const updateSchema = insertWebsiteSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      const website = await storage.getWebsite(id);
      if (!website) {
        return sendApiResponse(res, 404, false, 'Website not found');
      }
      
      const updatedWebsite = await storage.updateWebsite(id, parseResult.data);
      if (!updatedWebsite) {
        return sendApiResponse(res, 500, false, 'Failed to update website');
      }
      
      return sendApiResponse(res, 200, true, 'Website updated successfully', { website: updatedWebsite });
    } catch (error) {
      console.error('Update website error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update website');
    }
  });
  
  // Delete a website
  app.delete('/api/websites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid website ID');
      }
      
      const website = await storage.getWebsite(id);
      if (!website) {
        return sendApiResponse(res, 404, false, 'Website not found');
      }
      
      const deleted = await storage.deleteWebsite(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete website');
      }
      
      return sendApiResponse(res, 200, true, 'Website deleted successfully');
    } catch (error) {
      console.error('Delete website error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete website');
    }
  });

  // ================== ECOMMERCE STORE ROUTES ==================
  
  // Get all stores with pagination, filtering, and sorting
  app.get('/api/stores', async (req, res) => {
    try {
      const queryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
        filters: req.query.filters as Record<string, any> | undefined
      };
      
      const { stores, total } = await storage.getStores(queryOptions);
      
      return sendApiResponse(res, 200, true, 'Stores retrieved successfully', { 
        stores, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get stores error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve stores');
    }
  });
  
  // Get a specific store
  app.get('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid store ID');
      }
      
      const store = await storage.getStore(id);
      if (!store) {
        return sendApiResponse(res, 404, false, 'Store not found');
      }
      
      return sendApiResponse(res, 200, true, 'Store retrieved successfully', { store });
    } catch (error) {
      console.error('Get store error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve store');
    }
  });
  
  // Create a new store
  app.post('/api/stores', async (req, res) => {
    try {
      // Validate data
      const parseResult = insertEcommerceStoreSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(parseResult.data.userId);
      if (!user) {
        return sendApiResponse(res, 400, false, 'User not found');
      }
      
      const store = await storage.createStore(parseResult.data);
      
      return sendApiResponse(res, 201, true, 'Store created successfully', { store });
    } catch (error) {
      console.error('Create store error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create store');
    }
  });
  
  // Update a store
  app.patch('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid store ID');
      }
      
      // Validate update data
      const updateSchema = insertEcommerceStoreSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      const store = await storage.getStore(id);
      if (!store) {
        return sendApiResponse(res, 404, false, 'Store not found');
      }
      
      const updatedStore = await storage.updateStore(id, parseResult.data);
      if (!updatedStore) {
        return sendApiResponse(res, 500, false, 'Failed to update store');
      }
      
      return sendApiResponse(res, 200, true, 'Store updated successfully', { store: updatedStore });
    } catch (error) {
      console.error('Update store error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update store');
    }
  });
  
  // Delete a store
  app.delete('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid store ID');
      }
      
      const store = await storage.getStore(id);
      if (!store) {
        return sendApiResponse(res, 404, false, 'Store not found');
      }
      
      const deleted = await storage.deleteStore(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete store');
      }
      
      return sendApiResponse(res, 200, true, 'Store deleted successfully');
    } catch (error) {
      console.error('Delete store error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete store');
    }
  });

  // ================== PRODUCT ROUTES ==================
  
  // Get all products with pagination, filtering, and sorting
  app.get('/api/products', async (req, res) => {
    try {
      const queryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
        filters: req.query.filters as Record<string, any> | undefined
      };
      
      const { products, total } = await storage.getProducts(queryOptions);
      
      return sendApiResponse(res, 200, true, 'Products retrieved successfully', { 
        products, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get products error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve products');
    }
  });
  
  // Get a specific product
  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid product ID');
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return sendApiResponse(res, 404, false, 'Product not found');
      }
      
      return sendApiResponse(res, 200, true, 'Product retrieved successfully', { product });
    } catch (error) {
      console.error('Get product error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve product');
    }
  });
  
  // Create a new product
  app.post('/api/products', async (req, res) => {
    try {
      // Validate data
      const parseResult = insertProductSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      // Check if store exists
      const store = await storage.getStore(parseResult.data.storeId);
      if (!store) {
        return sendApiResponse(res, 400, false, 'Store not found');
      }
      
      const product = await storage.createProduct(parseResult.data);
      
      return sendApiResponse(res, 201, true, 'Product created successfully', { product });
    } catch (error) {
      console.error('Create product error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create product');
    }
  });
  
  // Update a product
  app.patch('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid product ID');
      }
      
      // Validate update data
      const updateSchema = insertProductSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return sendApiResponse(res, 404, false, 'Product not found');
      }
      
      const updatedProduct = await storage.updateProduct(id, parseResult.data);
      if (!updatedProduct) {
        return sendApiResponse(res, 500, false, 'Failed to update product');
      }
      
      return sendApiResponse(res, 200, true, 'Product updated successfully', { product: updatedProduct });
    } catch (error) {
      console.error('Update product error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update product');
    }
  });
  
  // Delete a product
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid product ID');
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return sendApiResponse(res, 404, false, 'Product not found');
      }
      
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete product');
      }
      
      return sendApiResponse(res, 200, true, 'Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete product');
    }
  });

  // ================== EVENTS ROUTES ==================

app.get('/api/events', async (req, res) => {
  try {
    const result = await eventService.getEvents();
    if (!result.success) {
      return sendApiResponse(res, 500, false, result.error || 'Error retrieving events');
    }
    return sendApiResponse(res, 200, true, 'Events retrieved successfully', { events: result.data });
  } catch (error: any) {
    console.error('Get events error:', error);
    return sendApiResponse(res, 500, false, 'Failed to retrieve events');
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body);
    if (!result.success) {
      return sendApiResponse(res, 500, false, result.error || 'Error creating event');
    }
    return sendApiResponse(res, 201, true, 'Event created successfully', { event: result.data });
  } catch (error: any) {
    console.error('Create event error:', error);
    return sendApiResponse(res, 500, false, 'Failed to create event');
  }
});

app.post('/api/events/:id/register', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return sendApiResponse(res, 400, false, 'Invalid event ID');
    }

    const result = await eventService.registerForEvent({
      ...req.body,
      eventId
    });
    
    if (!result.success) {
      return sendApiResponse(res, 500, false, result.error || 'Error registering for event');
    }
    
    return sendApiResponse(res, 201, true, 'Successfully registered for event', { registration: result.data });
  } catch (error: any) {
    console.error('Event registration error:', error);
    return sendApiResponse(res, 500, false, 'Failed to register for event');
  }
});

app.post('/api/events/:id/suggest-times', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return sendApiResponse(res, 400, false, 'Invalid event ID');
    }

    const result = await eventService.suggestAlternativeTimes(eventId);
    if (!result.success) {
      return sendApiResponse(res, 500, false, result.error || 'Error suggesting alternative times');
    }
    
    return sendApiResponse(res, 200, true, 'Alternative times suggested successfully', { suggestions: result.data });
  } catch (error: any) {
    console.error('Suggest times error:', error);
    return sendApiResponse(res, 500, false, 'Failed to suggest alternative times');
  }
});

// ================== NEWSLETTER SUBSCRIBERS ROUTES ==================
  
  // Get all subscribers with pagination, filtering, and sorting
  app.get('/api/subscribers', async (req, res) => {
    try {
      const queryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
        filters: req.query.filters as Record<string, any> | undefined
      };
      
      const { subscribers, total } = await storage.getSubscribers(queryOptions);
      
      return sendApiResponse(res, 200, true, 'Subscribers retrieved successfully', { 
        subscribers, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get subscribers error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve subscribers');
    }
  });

  // API endpoint for newsletter subscription
  app.post('/api/subscribe', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendApiResponse(res, 400, false, 'Please provide a valid email address.');
      }
      
      // Validate with zod schema
      const parseResult = insertNewsletterSubscriberSchema.safeParse({ 
        email,
        name: name || null,
        status: 'active'
      });
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', {
          errors: parseResult.error.format()
        });
      }
      
      // Save to database
      const [subscriber] = await db.insert(newsletterSubscribers)
        .values(parseResult.data)
        .returning();
      
      return sendApiResponse(res, 200, true, 'Successfully subscribed to newsletter!', {
        subscriber
      });
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      
      // Handle duplicate email error
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return sendApiResponse(res, 400, false, 'This email is already subscribed to our newsletter.');
      }
      
      return sendApiResponse(res, 500, false, 'An error occurred while processing your request.');
    }
  });
  
  // Update a subscriber
  app.patch('/api/subscribers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid subscriber ID');
      }
      
      const subscriber = await storage.getSubscriber(id);
      if (!subscriber) {
        return sendApiResponse(res, 404, false, 'Subscriber not found');
      }
      
      // Validate update data
      const updateSchema = insertNewsletterSubscriberSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', { 
          errors: parseResult.error.format() 
        });
      }
      
      const updatedSubscriber = await storage.updateSubscriber(id, parseResult.data);
      if (!updatedSubscriber) {
        return sendApiResponse(res, 500, false, 'Failed to update subscriber');
      }
      
      return sendApiResponse(res, 200, true, 'Subscriber updated successfully', { subscriber: updatedSubscriber });
    } catch (error) {
      console.error('Update subscriber error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update subscriber');
    }
  });
  
  // Delete a subscriber
  app.delete('/api/subscribers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid subscriber ID');
      }
      
      const subscriber = await storage.getSubscriber(id);
      if (!subscriber) {
        return sendApiResponse(res, 404, false, 'Subscriber not found');
      }
      
      const deleted = await storage.deleteSubscriber(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete subscriber');
      }
      
      return sendApiResponse(res, 200, true, 'Subscriber deleted successfully');
    } catch (error) {
      console.error('Delete subscriber error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete subscriber');
    }
  });

  // ================== CONTACT MESSAGES ROUTES ==================
  
  // Get all contact messages with pagination, filtering, and sorting
  app.get('/api/messages', async (req, res) => {
    try {
      const queryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        searchFields: req.query.searchFields as string[] | undefined,
        filters: req.query.filters as Record<string, any> | undefined
      };
      
      const { messages, total } = await storage.getMessages(queryOptions);
      
      return sendApiResponse(res, 200, true, 'Messages retrieved successfully', { 
        messages, 
        total,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve messages');
    }
  });

  // API endpoint for contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return sendApiResponse(res, 400, false, 'Please fill in all fields.');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendApiResponse(res, 400, false, 'Please provide a valid email address.');
      }
      
      // Validate with zod schema
      const parseResult = insertContactMessageSchema.safeParse({ 
        name,
        email,
        message
      });
      
      if (!parseResult.success) {
        return sendApiResponse(res, 400, false, 'Invalid data provided', {
          errors: parseResult.error.format()
        });
      }
      
      // Save to database
      const [contactMessage] = await db.insert(contactMessages)
        .values(parseResult.data)
        .returning();
      
      return sendApiResponse(res, 200, true, 'Your message has been sent. We will contact you shortly!', {
        contactMessage
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      return sendApiResponse(res, 500, false, 'An error occurred while processing your request.');
    }
  });
  
  // Update a message (e.g., mark as read)
  app.patch('/api/messages/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid message ID');
      }
      
      const message = await storage.getMessage(id);
      if (!message) {
        return sendApiResponse(res, 404, false, 'Message not found');
      }
      
      const updatedMessage = await storage.updateMessage(id, req.body);
      if (!updatedMessage) {
        return sendApiResponse(res, 500, false, 'Failed to update message');
      }
      
      return sendApiResponse(res, 200, true, 'Message updated successfully', { message: updatedMessage });
    } catch (error) {
      console.error('Update message error:', error);
      return sendApiResponse(res, 500, false, 'Failed to update message');
    }
  });
  
  // Delete a message
  app.delete('/api/messages/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid message ID');
      }
      
      const message = await storage.getMessage(id);
      if (!message) {
        return sendApiResponse(res, 404, false, 'Message not found');
      }
      
      const deleted = await storage.deleteMessage(id);
      if (!deleted) {
        return sendApiResponse(res, 500, false, 'Failed to delete message');
      }
      
      return sendApiResponse(res, 200, true, 'Message deleted successfully');
    } catch (error) {
      console.error('Delete message error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete message');
    }
  });

  // ================== AI OMNILAYER ROUTES ==================
  
  // AI Models
  app.get('/api/ai/models', async (req, res) => {
    try {
      const result = await aiService.getAllModels();
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving AI models');
      }
      return sendApiResponse(res, 200, true, 'AI models retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get AI models error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve AI models');
    }
  });
  
  app.get('/api/ai/models/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid model ID');
      }
      
      const result = await aiService.getModelById(id);
      if (!result.success) {
        return sendApiResponse(res, 404, false, result.error || 'Model not found');
      }
      
      return sendApiResponse(res, 200, true, 'AI model retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get AI model error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve AI model');
    }
  });
  
  app.post('/api/ai/models', async (req, res) => {
    try {
      const result = await aiService.createModel(req.body);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating AI model');
      }
      
      return sendApiResponse(res, 201, true, 'AI model created successfully', result.data);
    } catch (error: any) {
      console.error('Create AI model error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create AI model');
    }
  });
  
  // AI Agents
  app.get('/api/ai/agents', async (req, res) => {
    try {
      const result = await aiService.getAllAgents();
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving AI agents');
      }
      
      return sendApiResponse(res, 200, true, 'AI agents retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get AI agents error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve AI agents');
    }
  });
  
  app.get('/api/ai/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid agent ID');
      }
      
      const result = await aiService.getAgentById(id);
      if (!result.success) {
        return sendApiResponse(res, 404, false, result.error || 'Agent not found');
      }
      
      return sendApiResponse(res, 200, true, 'AI agent retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get AI agent error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve AI agent');
    }
  });
  
  app.post('/api/ai/agents', async (req, res) => {
    try {
      // Add the current user ID
      const userId = 1; // In a real app, get from authenticated session
      const agentData = { ...req.body, userId };
      
      const result = await aiService.createAgent(agentData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating AI agent');
      }
      
      return sendApiResponse(res, 201, true, 'AI agent created successfully', result.data);
    } catch (error: any) {
      console.error('Create AI agent error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create AI agent');
    }
  });
  
  app.delete('/api/ai/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid agent ID');
      }
      
      const result = await aiService.deleteAgent(id);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error deleting AI agent');
      }
      
      return sendApiResponse(res, 200, true, 'AI agent deleted successfully', result.data);
    } catch (error: any) {
      console.error('Delete AI agent error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete AI agent');
    }
  });
  
  // AI Conversations
  app.get('/api/ai/conversations', async (req, res) => {
    try {
      const result = await aiService.getAllConversations();
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving conversations');
      }
      
      return sendApiResponse(res, 200, true, 'Conversations retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get conversations error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve conversations');
    }
  });
  
  app.get('/api/ai/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid conversation ID');
      }
      
      const result = await aiService.getConversationById(id);
      if (!result.success) {
        return sendApiResponse(res, 404, false, result.error || 'Conversation not found');
      }
      
      return sendApiResponse(res, 200, true, 'Conversation retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get conversation error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve conversation');
    }
  });
  
  app.post('/api/ai/conversations', async (req, res) => {
    try {
      // Add the current user ID
      const userId = 1; // In a real app, get from authenticated session
      const conversationData = { ...req.body, userId };
      
      const result = await aiService.createConversation(conversationData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating conversation');
      }
      
      return sendApiResponse(res, 201, true, 'Conversation created successfully', result.data);
    } catch (error: any) {
      console.error('Create conversation error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create conversation');
    }
  });
  
  app.delete('/api/ai/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid conversation ID');
      }
      
      const result = await aiService.deleteConversation(id);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error deleting conversation');
      }
      
      return sendApiResponse(res, 200, true, 'Conversation deleted successfully', result.data);
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      return sendApiResponse(res, 500, false, 'Failed to delete conversation');
    }
  });
  
  // AI Messages
  app.get('/api/ai/conversations/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid conversation ID');
      }
      
      const result = await aiService.getMessagesForConversation(id);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving messages');
      }
      
      return sendApiResponse(res, 200, true, 'Messages retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get messages error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve messages');
    }
  });
  
  app.post('/api/ai/conversations/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid conversation ID');
      }
      
      const messageData = { ...req.body, conversationId: id };
      const result = await aiService.createMessage(messageData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating message');
      }
      
      return sendApiResponse(res, 201, true, 'Message created successfully', result.data);
    } catch (error: any) {
      console.error('Create message error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create message');
    }
  });
  
  // Echoverse Support Chatbot
  // Marketplace routes
app.get('/api/marketplace/search', async (req, res) => {
  try {
    const { q: query, category, type } = req.query;
    const result = await marketplaceService.searchItems(
      query as string,
      category ? parseInt(category as string) : undefined,
      type as string
    );
    return sendApiResponse(res, 200, result.success, 'Search results', result.data);
  } catch (error: any) {
    return sendApiResponse(res, 500, false, error.message);
  }
});

app.get('/api/marketplace/recommendations', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const result = await marketplaceService.getRecommendations(userId);
    return sendApiResponse(res, 200, result.success, 'Recommendations retrieved', result.data);
  } catch (error: any) {
    return sendApiResponse(res, 500, false, error.message);
  }
});

app.post('/api/marketplace/purchase/:itemId', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const userId = req.user.id; // Assuming auth middleware sets this
    const result = await marketplaceService.purchaseItem(userId, itemId);
    return sendApiResponse(res, 200, result.success, 'Purchase successful', result.data);
  } catch (error: any) {
    return sendApiResponse(res, 500, false, error.message);
  }
});

app.post('/api/marketplace/install/:itemId', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const userId = req.user.id; // Assuming auth middleware sets this
    const { projectId } = req.body;
    const result = await marketplaceService.installAsset(userId, itemId, projectId);
    return sendApiResponse(res, 200, result.success, 'Installation successful', result.data);
  } catch (error: any) {
    return sendApiResponse(res, 500, false, error.message);
  }
});

app.post('/api/marketplace/reviews', async (req, res) => {
  try {
    const { itemId, rating, content } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets this
    const result = await marketplaceService.submitReview(userId, itemId, rating, content);
    return sendApiResponse(res, 200, result.success, 'Review submitted', result.data);
  } catch (error: any) {
    return sendApiResponse(res, 500, false, error.message);
  }
});

app.post('/api/ai/support', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return sendApiResponse(res, 400, false, 'Message is required');
      }
      
      const result = await aiService.getSupportResponse(message);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error getting support response');
      }
      
      return sendApiResponse(res, 200, true, 'Support response generated successfully', result.data);
    } catch (error: any) {
      console.error('Support chatbot error:', error);
      return sendApiResponse(res, 500, false, 'Failed to generate support response');
    }
  });
  
  // ================== SOCIAL NETWORK ROUTES ==================
  
  // Posts
  app.get('/api/social/posts', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await socialService.getAllPosts({ page, limit });
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving posts');
      }
      
      return sendApiResponse(res, 200, true, 'Posts retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get posts error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve posts');
    }
  });
  
  app.get('/api/social/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendApiResponse(res, 400, false, 'Invalid post ID');
      }
      
      const result = await socialService.getPostById(id);
      if (!result.success) {
        return sendApiResponse(res, 404, false, result.error || 'Post not found');
      }
      
      return sendApiResponse(res, 200, true, 'Post retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get post error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve post');
    }
  });
  
  app.post('/api/social/posts', async (req, res) => {
    try {
      // Add the current user ID
      const userId = 1; // In a real app, get from authenticated session
      const postData = { 
        ...req.body, 
        userId,
        checkAgeRestrictions: true, // Flag to trigger content analysis
      };
      
      const result = await socialService.createPost(postData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating post');
      }
      
      return sendApiResponse(res, 201, true, 'Post created successfully', result.data);
    } catch (error: any) {
      console.error('Create post error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create post');
    }
  });
  
  // Feed
  app.get('/api/social/feed', async (req, res) => {
    try {
      const userId = 1; // In a real app, get from authenticated session
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await socialService.getNewsFeed(userId, { page, limit });
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving feed');
      }
      
      return sendApiResponse(res, 200, true, 'Feed retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get feed error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve feed');
    }
  });
  
  // Comments
  app.post('/api/social/comments', async (req, res) => {
    try {
      // Add the current user ID
      const userId = 1; // In a real app, get from authenticated session
      const commentData = { 
        ...req.body, 
        userId,
        checkAgeRestrictions: true, // Flag to trigger content analysis
      };
      
      const result = await socialService.createComment(commentData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error creating comment');
      }
      
      return sendApiResponse(res, 201, true, 'Comment created successfully', result.data);
    } catch (error: any) {
      console.error('Create comment error:', error);
      return sendApiResponse(res, 500, false, 'Failed to create comment');
    }
  });
  
  // Reactions
  app.post('/api/social/reactions', async (req, res) => {
    try {
      // Add the current user ID
      const userId = 1; // In a real app, get from authenticated session
      const reactionData = { ...req.body, userId };
      
      const result = await socialService.toggleReaction(reactionData);
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error toggling reaction');
      }
      
      return sendApiResponse(res, 200, true, `Reaction ${result.data.action}`, result.data);
    } catch (error: any) {
      console.error('Toggle reaction error:', error);
      return sendApiResponse(res, 500, false, 'Failed to toggle reaction');
    }
  });
  
  // Groups
  app.get('/api/social/groups', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      
      const result = await socialService.getAllGroups({ page, limit, search });
      if (!result.success) {
        return sendApiResponse(res, 500, false, result.error || 'Error retrieving groups');
      }
      
      return sendApiResponse(res, 200, true, 'Groups retrieved successfully', result.data);
    } catch (error: any) {
      console.error('Get groups error:', error);
      return sendApiResponse(res, 500, false, 'Failed to retrieve groups');
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
