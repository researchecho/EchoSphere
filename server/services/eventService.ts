
import { db } from "../db";
import { events, eventSuggestions, eventRegistrations } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? 
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : 
  null;

export class EventService {
  async createEvent(eventData: any) {
    try {
      // Generate AI summary
      let aiSummary = null;
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "Generate a brief, natural summary of this event."
          }, {
            role: "user", 
            content: `Event: ${eventData.title}\nDescription: ${eventData.description}\nTime: ${eventData.startTime} - ${eventData.endTime}\nLocation: ${eventData.location}`
          }]
        });
        aiSummary = completion.choices[0].message.content;
      }

      const [event] = await db.insert(events).values({
        ...eventData,
        aiSummary
      }).returning();

      return { success: true, data: event };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getEvents() {
    try {
      const eventsList = await db.select().from(events);
      return { success: true, data: eventsList };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async registerForEvent(registrationData: any) {
    try {
      const [registration] = await db.insert(eventRegistrations)
        .values(registrationData)
        .returning();
      return { success: true, data: registration };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async suggestAlternativeTimes(eventId: number) {
    try {
      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      const conflictingEvents = await db.select()
        .from(events)
        .where(
          and(
            gte(events.startTime, new Date(event.startTime)),
            lte(events.endTime, new Date(event.endTime))
          )
        );

      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "Analyze scheduling conflicts and suggest alternative times."
          }, {
            role: "user",
            content: JSON.stringify({ event, conflictingEvents })
          }]
        });

        const suggestions = JSON.parse(completion.choices[0].message.content || "[]");
        
        for (const suggestion of suggestions) {
          await db.insert(eventSuggestions).values({
            eventId,
            suggestedStartTime: suggestion.startTime,
            suggestedEndTime: suggestion.endTime,
            reason: suggestion.reason,
            confidence: suggestion.confidence
          });
        }

        return { success: true, data: suggestions };
      }

      return { success: true, data: [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const eventService = new EventService();
