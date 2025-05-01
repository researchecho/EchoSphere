import { db } from "../db";
import { 
  aiModels, 
  aiAgents,
  aiConversations,
  aiMessages
} from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { createId } from '@paralleldrive/cuid2';

// Check if OPENAI_API_KEY is available
const hasOpenAIKey = process.env.OPENAI_API_KEY !== undefined;

// Initialize OpenAI client if API key is available
const openai = hasOpenAIKey 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Result interface for all service methods
interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AIService {
  
  // =========== AI Models =========== 
  
  async getAllModels(): Promise<ServiceResult> {
    try {
      const models = await db.select().from(aiModels);
      return { success: true, data: models };
    } catch (error: any) {
      console.error('Error fetching AI models:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getModelById(id: number): Promise<ServiceResult> {
    try {
      const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }
      
      return { success: true, data: model };
    } catch (error: any) {
      console.error(`Error fetching AI model ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createModel(modelData: any): Promise<ServiceResult> {
    try {
      // Validate model data
      if (!modelData.name || !modelData.provider || !modelData.modelId) {
        return { success: false, error: 'Name, provider, and modelId are required fields' };
      }
      
      // Insert the model into the database
      const [model] = await db.insert(aiModels).values({
        name: modelData.name,
        provider: modelData.provider,
        modelId: modelData.modelId,
        capabilities: modelData.capabilities || null,
        contextLength: modelData.contextLength || 4000,
        isActive: modelData.isActive !== undefined ? modelData.isActive : true,
        pricing: modelData.pricing || null,
      }).returning();
      
      return { success: true, data: model };
    } catch (error: any) {
      console.error('Error creating AI model:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateModel(id: number, modelData: any): Promise<ServiceResult> {
    try {
      // Ensure the model exists
      const [existingModel] = await db.select().from(aiModels).where(eq(aiModels.id, id));
      
      if (!existingModel) {
        return { success: false, error: 'Model not found' };
      }
      
      // Update the model
      const [updatedModel] = await db.update(aiModels)
        .set({
          name: modelData.name !== undefined ? modelData.name : existingModel.name,
          provider: modelData.provider !== undefined ? modelData.provider : existingModel.provider,
          modelId: modelData.modelId !== undefined ? modelData.modelId : existingModel.modelId,
          capabilities: modelData.capabilities !== undefined ? modelData.capabilities : existingModel.capabilities,
          contextLength: modelData.contextLength !== undefined ? modelData.contextLength : existingModel.contextLength,
          isActive: modelData.isActive !== undefined ? modelData.isActive : existingModel.isActive,
          pricing: modelData.pricing !== undefined ? modelData.pricing : existingModel.pricing,
          updatedAt: new Date(),
        })
        .where(eq(aiModels.id, id))
        .returning();
      
      return { success: true, data: updatedModel };
    } catch (error: any) {
      console.error(`Error updating AI model ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteModel(id: number): Promise<ServiceResult> {
    try {
      // Check if the model is in use by any agents
      const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.modelId, id));
      
      if (agent) {
        return { success: false, error: 'Cannot delete this model because it is in use by one or more agents' };
      }
      
      // Delete the model
      const [deletedModel] = await db.delete(aiModels).where(eq(aiModels.id, id)).returning();
      
      if (!deletedModel) {
        return { success: false, error: 'Model not found' };
      }
      
      return { success: true, data: { message: 'Model deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting AI model ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== AI Agents =========== 
  
  async getAllAgents(): Promise<ServiceResult> {
    try {
      const agents = await db.select().from(aiAgents);
      return { success: true, data: agents };
    } catch (error: any) {
      console.error('Error fetching AI agents:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getAgentById(id: number): Promise<ServiceResult> {
    try {
      const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
      
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }
      
      // Get the associated model
      const [model] = await db.select().from(aiModels).where(eq(aiModels.id, agent.modelId));
      
      return { 
        success: true, 
        data: { 
          ...agent,
          model 
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching AI agent ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createAgent(agentData: any): Promise<ServiceResult> {
    try {
      // Validate agent data
      if (!agentData.name || !agentData.modelId || !agentData.userId) {
        return { success: false, error: 'Name, modelId, and userId are required fields' };
      }
      
      // Check if the model exists
      const [model] = await db.select().from(aiModels).where(eq(aiModels.id, agentData.modelId));
      
      if (!model) {
        return { success: false, error: 'The specified model does not exist' };
      }
      
      // Insert the agent into the database
      const [agent] = await db.insert(aiAgents).values({
        name: agentData.name,
        description: agentData.description || null,
        userId: agentData.userId,
        modelId: agentData.modelId,
        systemPrompt: agentData.systemPrompt || 'You are a helpful AI assistant.',
        settings: agentData.settings || null,
        isPublic: agentData.isPublic || false,
        avatar: agentData.avatar || null,
        metadata: agentData.metadata || null,
      }).returning();
      
      return { success: true, data: agent };
    } catch (error: any) {
      console.error('Error creating AI agent:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateAgent(id: number, agentData: any): Promise<ServiceResult> {
    try {
      // Ensure the agent exists
      const [existingAgent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
      
      if (!existingAgent) {
        return { success: false, error: 'Agent not found' };
      }
      
      // If model ID is changing, verify the new model exists
      if (agentData.modelId && agentData.modelId !== existingAgent.modelId) {
        const [model] = await db.select().from(aiModels).where(eq(aiModels.id, agentData.modelId));
        
        if (!model) {
          return { success: false, error: 'The specified model does not exist' };
        }
      }
      
      // Update the agent
      const [updatedAgent] = await db.update(aiAgents)
        .set({
          name: agentData.name !== undefined ? agentData.name : existingAgent.name,
          description: agentData.description !== undefined ? agentData.description : existingAgent.description,
          modelId: agentData.modelId !== undefined ? agentData.modelId : existingAgent.modelId,
          systemPrompt: agentData.systemPrompt !== undefined ? agentData.systemPrompt : existingAgent.systemPrompt,
          settings: agentData.settings !== undefined ? agentData.settings : existingAgent.settings,
          isPublic: agentData.isPublic !== undefined ? agentData.isPublic : existingAgent.isPublic,
          avatar: agentData.avatar !== undefined ? agentData.avatar : existingAgent.avatar,
          metadata: agentData.metadata !== undefined ? agentData.metadata : existingAgent.metadata,
          updatedAt: new Date(),
        })
        .where(eq(aiAgents.id, id))
        .returning();
      
      return { success: true, data: updatedAgent };
    } catch (error: any) {
      console.error(`Error updating AI agent ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteAgent(id: number): Promise<ServiceResult> {
    try {
      // Delete the agent
      const [deletedAgent] = await db.delete(aiAgents).where(eq(aiAgents.id, id)).returning();
      
      if (!deletedAgent) {
        return { success: false, error: 'Agent not found' };
      }
      
      return { success: true, data: { message: 'Agent deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting AI agent ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== AI Conversations =========== 
  
  async getAllConversations(): Promise<ServiceResult> {
    try {
      const conversations = await db.select().from(aiConversations);
      return { success: true, data: conversations };
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getConversationById(id: number): Promise<ServiceResult> {
    try {
      const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
      
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }
      
      // Get the associated agent
      const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, conversation.agentId));
      
      // Get the associated messages
      const messages = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, id));
      
      return { 
        success: true, 
        data: { 
          ...conversation,
          agent,
          messages 
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching conversation ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createConversation(conversationData: any): Promise<ServiceResult> {
    try {
      // Validate conversation data
      if (!conversationData.agentId || !conversationData.userId) {
        return { success: false, error: 'AgentId and userId are required fields' };
      }
      
      // Check if the agent exists
      const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, conversationData.agentId));
      
      if (!agent) {
        return { success: false, error: 'The specified agent does not exist' };
      }
      
      // Insert the conversation into the database
      const [conversation] = await db.insert(aiConversations).values({
        title: conversationData.title || 'New Conversation',
        userId: conversationData.userId,
        agentId: conversationData.agentId,
        status: conversationData.status || 'active',
        metadata: conversationData.metadata || null,
      }).returning();
      
      // If a first message was provided, add it
      if (conversationData.message) {
        await this.createMessage({
          role: 'user',
          content: conversationData.message,
          conversationId: conversation.id
        });
      }
      
      return { success: true, data: conversation };
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateConversation(id: number, conversationData: any): Promise<ServiceResult> {
    try {
      // Ensure the conversation exists
      const [existingConversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
      
      if (!existingConversation) {
        return { success: false, error: 'Conversation not found' };
      }
      
      // Update the conversation
      const [updatedConversation] = await db.update(aiConversations)
        .set({
          title: conversationData.title !== undefined ? conversationData.title : existingConversation.title,
          status: conversationData.status !== undefined ? conversationData.status : existingConversation.status,
          metadata: conversationData.metadata !== undefined ? conversationData.metadata : existingConversation.metadata,
          updatedAt: new Date(),
        })
        .where(eq(aiConversations.id, id))
        .returning();
      
      return { success: true, data: updatedConversation };
    } catch (error: any) {
      console.error(`Error updating conversation ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteConversation(id: number): Promise<ServiceResult> {
    try {
      // Delete the conversation
      const [deletedConversation] = await db.delete(aiConversations)
        .where(eq(aiConversations.id, id))
        .returning();
      
      if (!deletedConversation) {
        return { success: false, error: 'Conversation not found' };
      }
      
      // Delete all associated messages
      await db.delete(aiMessages).where(eq(aiMessages.conversationId, id));
      
      return { success: true, data: { message: 'Conversation deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting conversation ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== AI Messages =========== 
  
  async getMessagesForConversation(conversationId: number): Promise<ServiceResult> {
    try {
      // Check if conversation exists
      const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, conversationId));
      
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }
      
      // Get all messages for this conversation
      const messages = await db.select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId));
      
      return { success: true, data: messages };
    } catch (error: any) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createMessage(messageData: any): Promise<ServiceResult> {
    try {
      // Validate message data
      if (!messageData.content || !messageData.conversationId) {
        return { success: false, error: 'Content and conversationId are required fields' };
      }
      
      // Check if conversation exists
      const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, messageData.conversationId));
      
      if (!conversation) {
        return { success: false, error: 'The specified conversation does not exist' };
      }
      
      // Default role to 'user' if not provided
      const role = messageData.role || 'user';
      
      // Insert the message into the database
      const [message] = await db.insert(aiMessages).values({
        conversationId: messageData.conversationId,
        role,
        content: messageData.content,
        metadata: messageData.metadata || null,
      }).returning();
      
      // If this is a user message, generate an AI response
      if (role === 'user') {
        // Get the agent for this conversation
        const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, conversation.agentId));
        
        if (!agent) {
          return { success: false, error: 'Agent not found for this conversation' };
        }
        
        // Get the model for this agent
        const [model] = await db.select().from(aiModels).where(eq(aiModels.id, agent.modelId));
        
        if (!model) {
          return { success: false, error: 'Model not found for this agent' };
        }
        
        // Generate AI response
        try {
          const aiResponse = await this.getAICompletion(
            [
              { role: 'system', content: agent.systemPrompt || 'You are a helpful AI assistant.' },
              { role: 'user', content: messageData.content }
            ],
            model.id
          );
          
          // Save the AI response as a new message
          const [aiMessage] = await db.insert(aiMessages).values({
            conversationId: messageData.conversationId,
            role: 'assistant',
            content: aiResponse,
            metadata: null,
          }).returning();
          
          // If this is a new conversation with a generic title, generate a better title
          if (conversation.title === 'New Conversation') {
            const title = await this.generateConversationTitle(messageData.content, aiResponse);
            await this.updateConversation(conversation.id, { title });
          }
          
          return { 
            success: true, 
            data: { 
              userMessage: message, 
              aiMessage 
            } 
          };
        } catch (error: any) {
          console.error('Error generating AI response:', error);
          
          // Still return success for the user message, but include the error
          return { 
            success: true, 
            data: { 
              userMessage: message,
              error: 'Failed to generate AI response: ' + error.message
            } 
          };
        }
      }
      
      return { success: true, data: message };
    } catch (error: any) {
      console.error('Error creating message:', error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== AI Utility Methods =========== 
  
  private async getAICompletion(messages: any[], modelId: number): Promise<string> {
    // Check if OpenAI API key is available
    if (!openai) {
      return "I'm sorry, but I can't generate a response because the OpenAI API key is not configured.";
    }
    
    try {
      // Get the model configuration
      const [model] = await db.select().from(aiModels).where(eq(aiModels.id, modelId));
      
      if (!model) {
        throw new Error('Model not found');
      }
      
      // Map our internal model ID to actual OpenAI model ID
      const modelName = model.modelId;
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: modelName, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content || "I couldn't generate a meaningful response.";
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
  
  private async generateConversationTitle(userMessage: string, aiResponse: string): Promise<string> {
    // Check if OpenAI API key is available
    if (!openai) {
      return "New Conversation";
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Generate a short, concise title (max 6 words) for a conversation based on the following exchange. Return only the title with no additional text or punctuation."
          },
          {
            role: "user",
            content: `User: ${userMessage}\n\nAssistant: ${aiResponse}`
          }
        ],
        temperature: 0.7,
        max_tokens: 20,
      });
      
      const title = completion.choices[0].message.content?.trim() || "New Conversation";
      return title;
    } catch (error) {
      console.error('Error generating conversation title:', error);
      return "New Conversation";
    }
  }
  
  // =========== Echoverse Support Chatbot =========== 
  
  async getSupportResponse(message: string): Promise<ServiceResult> {
    // Check if OpenAI API key is available
    if (!openai) {
      return { 
        success: true, 
        data: { 
          response: "I'm sorry, but I can't generate a response because the OpenAI API key is not configured. Please contact support for assistance."
        } 
      };
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are the Echoverse Support Chatbot, an AI assistant that helps users with platform-related questions. 
            Echoverse is an advanced AI-native multi-tenant SaaS platform delivering comprehensive business management solutions.
            
            Key features include:
            - AI Omnilayer System with professional AI agents
            - Website Builder + CMS with blogging capabilities
            - E-Commerce with Stripe integration
            - Social Network (messaging, groups, news feeds with age restrictions)
            - Educational Portal
            - CRM + Marketing tools
            - Marketplace for plugins
            - Job listings
            - Booking systems
            - Developer APIs + SDKs
            
            Be friendly, professional, and helpful. If you don't know the answer, suggest contacting the support team at support@echoverse.io.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
      });
      
      return { 
        success: true, 
        data: { 
          response: completion.choices[0].message.content || "I apologize, but I couldn't generate a meaningful response. Please try again or contact our support team for assistance."
        } 
      };
    } catch (error: any) {
      console.error('Error generating support response:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async analyzeContentForAgeRestrictions(content: string): Promise<ServiceResult> {
    // Check if OpenAI API key is available
    if (!openai) {
      return { 
        success: true, 
        data: { 
          isAppropriate: true,
          minimumAge: null,
          parentalControlLevel: 'low', 
          explanation: "Content analysis couldn't be performed due to missing OpenAI API key."
        } 
      };
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI. Your task is to analyze the given content and determine:
            1. Whether the content is appropriate for all ages
            2. If not, what minimum age is appropriate (13, 16, 18, or 21)
            3. What parental control level should be set (low, medium, high)
            4. A brief explanation for your decision
            
            Respond with JSON in this format:
            {
              "isAppropriate": boolean,
              "minimumAge": number or null,
              "parentalControlLevel": "low" | "medium" | "high",
              "explanation": "string"
            }
            
            Consider the presence of profanity, sensitive topics, adult content, violence, discrimination, etc.
            - low: Some mild language or themes that parents might want to know about, but generally acceptable
            - medium: Content that contains some mature themes or language that may be inappropriate for younger children
            - high: Content that contains explicit language, sensitive topics, or mature themes`
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      const analysisResult = JSON.parse(completion.choices[0].message.content || "{}");
      
      return { 
        success: true, 
        data: analysisResult
      };
    } catch (error: any) {
      console.error('Error analyzing content for age restrictions:', error);
      return { 
        success: true, 
        data: { 
          isAppropriate: true,
          minimumAge: null,
          parentalControlLevel: 'low', 
          explanation: "Content analysis couldn't be performed due to an error. Content is being treated as appropriate by default."
        } 
      };
    }
  }
}