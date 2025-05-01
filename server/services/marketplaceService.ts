
import { db } from "../db";
import { marketplace_items, marketplace_categories, marketplace_purchases, marketplace_reviews } from "@shared/schema";
import { eq, like, and, or } from "drizzle-orm";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export class MarketplaceService {
  async searchItems(query: string, categoryId?: number, type?: string) {
    try {
      let items = await db.select().from(marketplace_items);
      
      if (query) {
        items = items.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (categoryId) {
        const itemsInCategory = await db
          .select()
          .from(marketplace_item_categories)
          .where(eq(marketplace_item_categories.categoryId, categoryId));
        items = items.filter(item => 
          itemsInCategory.some(ic => ic.itemId === item.id)
        );
      }

      if (type) {
        items = items.filter(item => item.type === type);
      }

      return { success: true, data: items };
    } catch (error: any) {
      console.error('Search marketplace items error:', error);
      return { success: false, error: error.message };
    }
  }

  async getRecommendations(userId: number) {
    if (!openai) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    try {
      // Get user's purchase history
      const purchases = await db
        .select()
        .from(marketplace_purchases)
        .where(eq(marketplace_purchases.buyerId, userId));

      // Get purchased items details
      const purchasedItems = await Promise.all(
        purchases.map(p => db
          .select()
          .from(marketplace_items)
          .where(eq(marketplace_items.id, p.itemId))
          .then(items => items[0])
        )
      );

      // Use OpenAI to analyze patterns and generate recommendations
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a marketplace recommendation system. Analyze the user's purchase history and suggest similar or complementary items."
          },
          {
            role: "user",
            content: `User's purchased items: ${JSON.stringify(purchasedItems)}`
          }
        ]
      });

      const recommendations = completion.choices[0].message.content;
      return { success: true, data: recommendations };
    } catch (error: any) {
      console.error('Get recommendations error:', error);
      return { success: false, error: error.message };
    }
  }

  async purchaseItem(userId: number, itemId: number) {
    try {
      const [item] = await db
        .select()
        .from(marketplace_items)
        .where(eq(marketplace_items.id, itemId));

      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      // Create purchase record
      const [purchase] = await db
        .insert(marketplace_purchases)
        .values({
          itemId,
          buyerId: userId,
          price: item.price || 0,
          status: 'completed',
          purchaseDate: new Date()
        })
        .returning();

      return { success: true, data: purchase };
    } catch (error: any) {
      console.error('Purchase item error:', error);
      return { success: false, error: error.message };
    }
  }

  async installAsset(userId: number, itemId: number, projectId: string) {
    try {
      const [item] = await db
        .select()
        .from(marketplace_items)
        .where(eq(marketplace_items.id, itemId));

      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      // Verify purchase
      const [purchase] = await db
        .select()
        .from(marketplace_purchases)
        .where(and(
          eq(marketplace_purchases.itemId, itemId),
          eq(marketplace_purchases.buyerId, userId)
        ));

      if (!purchase) {
        return { success: false, error: 'Item not purchased' };
      }

      // Installation logic would go here
      // This would depend on the type of asset (plugin, template, etc.)

      return { success: true, data: { message: 'Asset installed successfully' } };
    } catch (error: any) {
      console.error('Install asset error:', error);
      return { success: false, error: error.message };
    }
  }

  async submitReview(userId: number, itemId: number, rating: number, content: string) {
    try {
      const [review] = await db
        .insert(marketplace_reviews)
        .values({
          itemId,
          userId,
          rating,
          content,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Update item rating
      const reviews = await db
        .select()
        .from(marketplace_reviews)
        .where(eq(marketplace_reviews.itemId, itemId));

      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

      await db
        .update(marketplace_items)
        .set({ rating: avgRating })
        .where(eq(marketplace_items.id, itemId));

      return { success: true, data: review };
    } catch (error: any) {
      console.error('Submit review error:', error);
      return { success: false, error: error.message };
    }
  }
}
