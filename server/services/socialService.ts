import { db } from "../db";
import { 
  users,
  socialPosts, 
  socialComments,
  socialReactions,
  socialGroups,
  socialGroupMembers,
  socialMessages,
  socialFriendships
} from "@shared/schema";
import { eq, and, or, desc, asc, sql, like, not, isNull, ne, count, inArray } from "drizzle-orm";
import { AIService } from "./aiService";

// Result interface for all service methods
interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SocialService {
  private aiService: AIService;
  
  constructor() {
    this.aiService = new AIService();
  }
  
  // =========== Social Posts =========== 
  
  async getAllPosts(options: { page?: number; limit?: number } = {}): Promise<ServiceResult> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      // Get posts with author info, reaction count, and comment count
      const postsQuery = db.select({
          post: socialPosts,
          author: users,
          reactionCount: sql<number>`cast(count(distinct ${socialReactions.id}) as int)`,
          commentCount: sql<number>`cast(count(distinct ${socialComments.id}) as int)`
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .leftJoin(socialReactions, eq(socialPosts.id, socialReactions.postId))
        .leftJoin(socialComments, eq(socialPosts.id, socialComments.postId))
        .where(eq(socialPosts.isPublic, true))
        .groupBy(socialPosts.id, users.id)
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset);
      
      const posts = await postsQuery;
      
      // Get total count
      const [{ value: total }] = await db
        .select({ value: count() })
        .from(socialPosts)
        .where(eq(socialPosts.isPublic, true));
      
      return { 
        success: true, 
        data: { 
          posts,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        } 
      };
    } catch (error: any) {
      console.error('Error fetching social posts:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getPostById(id: number): Promise<ServiceResult> {
    try {
      // Get the post with author info
      const [postData] = await db.select({
          post: socialPosts,
          author: users
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(eq(socialPosts.id, id));
      
      if (!postData) {
        return { success: false, error: 'Post not found' };
      }
      
      // Get comments for this post
      const comments = await db.select({
          comment: socialComments,
          author: users,
          reactionCount: sql<number>`cast(count(distinct ${socialReactions.id}) as int)`
        })
        .from(socialComments)
        .leftJoin(users, eq(socialComments.userId, users.id))
        .leftJoin(socialReactions, and(
          eq(socialReactions.commentId, socialComments.id),
          isNull(socialReactions.postId)
        ))
        .where(eq(socialComments.postId, id))
        .groupBy(socialComments.id, users.id)
        .orderBy(desc(socialComments.createdAt));
      
      // Get reactions for this post
      const reactions = await db.select({
          reaction: socialReactions,
          user: users
        })
        .from(socialReactions)
        .leftJoin(users, eq(socialReactions.userId, users.id))
        .where(eq(socialReactions.postId, id));
      
      // Count reactions by type
      const reactionCounts = reactions.reduce((acc, { reaction }) => {
        const type = reaction.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return { 
        success: true, 
        data: { 
          ...postData,
          comments,
          reactions,
          reactionCounts
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching post ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createPost(postData: any): Promise<ServiceResult> {
    try {
      // Validate post data
      if (!postData.content || !postData.userId) {
        return { success: false, error: 'Content and userId are required fields' };
      }
      
      // Check for age restrictions if requested
      let ageRestricted = postData.ageRestricted;
      let minimumAge = postData.minimumAge;
      let parentalControlLevel = postData.parentalControlLevel;
      
      if (postData.checkAgeRestrictions) {
        try {
          const contentAnalysis = await this.aiService.analyzeContentForAgeRestrictions(postData.content);
          
          if (contentAnalysis.success && contentAnalysis.data) {
            if (!contentAnalysis.data.isAppropriate) {
              ageRestricted = true;
              minimumAge = contentAnalysis.data.minimumAge || 13;
              parentalControlLevel = contentAnalysis.data.parentalControlLevel || 'medium';
            }
          }
        } catch (analysisError) {
          console.error('Error analyzing content for age restrictions:', analysisError);
          // Continue with post creation even if analysis fails
        }
      }
      
      // Insert the post into the database
      const [post] = await db.insert(socialPosts).values({
        userId: postData.userId,
        groupId: postData.groupId || null,
        content: postData.content,
        attachments: postData.attachments || null,
        isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
        ageRestricted: ageRestricted !== undefined ? ageRestricted : false,
        minimumAge: minimumAge || null,
        parentalControlLevel: parentalControlLevel || null,
      }).returning();
      
      return { success: true, data: post };
    } catch (error: any) {
      console.error('Error creating social post:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updatePost(id: number, postData: any): Promise<ServiceResult> {
    try {
      // Ensure the post exists
      const [existingPost] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
      
      if (!existingPost) {
        return { success: false, error: 'Post not found' };
      }
      
      // Verify user is the owner
      if (postData.userId && existingPost.userId !== postData.userId) {
        return { success: false, error: 'You can only update your own posts' };
      }
      
      // Check for age restrictions if content changed and requested
      let ageRestricted = postData.ageRestricted !== undefined 
        ? postData.ageRestricted 
        : existingPost.ageRestricted;
      
      let minimumAge = postData.minimumAge !== undefined 
        ? postData.minimumAge 
        : existingPost.minimumAge;
      
      let parentalControlLevel = postData.parentalControlLevel !== undefined 
        ? postData.parentalControlLevel 
        : existingPost.parentalControlLevel;
      
      if (postData.content && postData.content !== existingPost.content && postData.checkAgeRestrictions) {
        try {
          const contentAnalysis = await this.aiService.analyzeContentForAgeRestrictions(postData.content);
          
          if (contentAnalysis.success && contentAnalysis.data) {
            if (!contentAnalysis.data.isAppropriate) {
              ageRestricted = true;
              minimumAge = contentAnalysis.data.minimumAge || 13;
              parentalControlLevel = contentAnalysis.data.parentalControlLevel || 'medium';
            }
          }
        } catch (analysisError) {
          console.error('Error analyzing content for age restrictions:', analysisError);
          // Continue with post update even if analysis fails
        }
      }
      
      // Update the post
      const [updatedPost] = await db.update(socialPosts)
        .set({
          content: postData.content !== undefined ? postData.content : existingPost.content,
          attachments: postData.attachments !== undefined ? postData.attachments : existingPost.attachments,
          isPublic: postData.isPublic !== undefined ? postData.isPublic : existingPost.isPublic,
          ageRestricted,
          minimumAge,
          parentalControlLevel,
          updatedAt: new Date(),
        })
        .where(eq(socialPosts.id, id))
        .returning();
      
      return { success: true, data: updatedPost };
    } catch (error: any) {
      console.error(`Error updating post ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deletePost(id: number, userId: number): Promise<ServiceResult> {
    try {
      // Ensure the post exists and belongs to the user
      const [post] = await db.select().from(socialPosts)
        .where(and(eq(socialPosts.id, id), eq(socialPosts.userId, userId)));
      
      if (!post) {
        return { success: false, error: 'Post not found or you do not have permission to delete it' };
      }
      
      // Delete all comments for this post
      await db.delete(socialComments).where(eq(socialComments.postId, id));
      
      // Delete all reactions for this post
      await db.delete(socialReactions).where(eq(socialReactions.postId, id));
      
      // Delete the post
      const [deletedPost] = await db.delete(socialPosts)
        .where(eq(socialPosts.id, id))
        .returning();
      
      return { success: true, data: { message: 'Post deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting post ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Social Comments =========== 
  
  async createComment(commentData: any): Promise<ServiceResult> {
    try {
      // Validate comment data
      if (!commentData.content || !commentData.postId || !commentData.userId) {
        return { success: false, error: 'Content, postId, and userId are required fields' };
      }
      
      // Check if post exists
      const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, commentData.postId));
      
      if (!post) {
        return { success: false, error: 'The specified post does not exist' };
      }
      
      // Check for age restrictions if requested
      let ageRestricted = commentData.ageRestricted;
      
      if (commentData.checkAgeRestrictions) {
        try {
          const contentAnalysis = await this.aiService.analyzeContentForAgeRestrictions(commentData.content);
          
          if (contentAnalysis.success && contentAnalysis.data) {
            if (!contentAnalysis.data.isAppropriate) {
              ageRestricted = true;
            }
          }
        } catch (analysisError) {
          console.error('Error analyzing content for age restrictions:', analysisError);
          // Continue with comment creation even if analysis fails
        }
      }
      
      // Insert the comment into the database
      const [comment] = await db.insert(socialComments).values({
        postId: commentData.postId,
        userId: commentData.userId,
        parentId: commentData.parentId || null,
        content: commentData.content,
        attachments: commentData.attachments || null,
        ageRestricted: ageRestricted !== undefined ? ageRestricted : false,
      }).returning();
      
      return { success: true, data: comment };
    } catch (error: any) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateComment(id: number, commentData: any): Promise<ServiceResult> {
    try {
      // Ensure the comment exists
      const [existingComment] = await db.select().from(socialComments).where(eq(socialComments.id, id));
      
      if (!existingComment) {
        return { success: false, error: 'Comment not found' };
      }
      
      // Verify user is the owner
      if (commentData.userId && existingComment.userId !== commentData.userId) {
        return { success: false, error: 'You can only update your own comments' };
      }
      
      // Check for age restrictions if content changed and requested
      let ageRestricted = commentData.ageRestricted !== undefined 
        ? commentData.ageRestricted 
        : existingComment.ageRestricted;
      
      if (commentData.content && commentData.content !== existingComment.content && commentData.checkAgeRestrictions) {
        try {
          const contentAnalysis = await this.aiService.analyzeContentForAgeRestrictions(commentData.content);
          
          if (contentAnalysis.success && contentAnalysis.data) {
            if (!contentAnalysis.data.isAppropriate) {
              ageRestricted = true;
            }
          }
        } catch (analysisError) {
          console.error('Error analyzing content for age restrictions:', analysisError);
          // Continue with comment update even if analysis fails
        }
      }
      
      // Update the comment
      const [updatedComment] = await db.update(socialComments)
        .set({
          content: commentData.content !== undefined ? commentData.content : existingComment.content,
          attachments: commentData.attachments !== undefined ? commentData.attachments : existingComment.attachments,
          ageRestricted,
          updatedAt: new Date(),
        })
        .where(eq(socialComments.id, id))
        .returning();
      
      return { success: true, data: updatedComment };
    } catch (error: any) {
      console.error(`Error updating comment ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteComment(id: number, userId: number): Promise<ServiceResult> {
    try {
      // Ensure the comment exists and belongs to the user
      const [comment] = await db.select().from(socialComments)
        .where(and(eq(socialComments.id, id), eq(socialComments.userId, userId)));
      
      if (!comment) {
        return { success: false, error: 'Comment not found or you do not have permission to delete it' };
      }
      
      // Delete all reactions for this comment
      await db.delete(socialReactions).where(eq(socialReactions.commentId, id));
      
      // Delete the comment
      const [deletedComment] = await db.delete(socialComments)
        .where(eq(socialComments.id, id))
        .returning();
      
      return { success: true, data: { message: 'Comment deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting comment ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Social Reactions =========== 
  
  async toggleReaction(reactionData: any): Promise<ServiceResult> {
    try {
      // Validate reaction data
      if (!reactionData.userId || (!reactionData.postId && !reactionData.commentId) || !reactionData.type) {
        return { 
          success: false, 
          error: 'userId, reaction type, and either postId or commentId are required' 
        };
      }
      
      // Check if reaction already exists
      const query = reactionData.postId 
        ? and(
            eq(socialReactions.userId, reactionData.userId),
            eq(socialReactions.postId, reactionData.postId),
            eq(socialReactions.type, reactionData.type)
          )
        : and(
            eq(socialReactions.userId, reactionData.userId),
            eq(socialReactions.commentId, reactionData.commentId),
            eq(socialReactions.type, reactionData.type)
          );
      
      const [existingReaction] = await db.select().from(socialReactions).where(query);
      
      // If reaction exists, remove it
      if (existingReaction) {
        await db.delete(socialReactions).where(eq(socialReactions.id, existingReaction.id));
        
        return { 
          success: true, 
          data: { 
            action: 'removed',
            type: reactionData.type
          } 
        };
      }
      
      // Otherwise, add the new reaction
      const [reaction] = await db.insert(socialReactions).values({
        userId: reactionData.userId,
        postId: reactionData.postId || null,
        commentId: reactionData.commentId || null,
        type: reactionData.type,
      }).returning();
      
      return { 
        success: true, 
        data: { 
          action: 'added',
          type: reactionData.type,
          reaction 
        } 
      };
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Social Groups =========== 
  
  async getAllGroups(options: { page?: number; limit?: number; search?: string } = {}): Promise<ServiceResult> {
    try {
      const { page = 1, limit = 10, search = '' } = options;
      const offset = (page - 1) * limit;
      
      // Build the query
      let query = db.select({
          group: socialGroups,
          memberCount: sql<number>`cast(count(distinct ${socialGroupMembers.id}) as int)`
        })
        .from(socialGroups)
        .leftJoin(socialGroupMembers, eq(socialGroups.id, socialGroupMembers.groupId))
        .groupBy(socialGroups.id);
      
      // Add search filter if provided
      if (search) {
        query = query.where(
          or(
            like(socialGroups.name, `%${search}%`),
            like(socialGroups.description || '', `%${search}%`)
          )
        );
      }
      
      // Add pagination and fetch results
      const groups = await query
        .orderBy(desc(socialGroups.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      let countQuery = db
        .select({ count: sql`count(*)` })
        .from(socialGroups);
      
      // Add search filter to count query if provided
      if (search) {
        countQuery = countQuery.where(
          or(
            like(socialGroups.name, `%${search}%`),
            like(socialGroups.description || '', `%${search}%`)
          )
        );
      }
      
      const [{ count }] = await countQuery;
      const total = Number(count);
      
      return { 
        success: true, 
        data: { 
          groups,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        } 
      };
    } catch (error: any) {
      console.error('Error fetching social groups:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getGroupById(id: number): Promise<ServiceResult> {
    try {
      // Get the group
      const [group] = await db.select().from(socialGroups).where(eq(socialGroups.id, id));
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }
      
      // Get the creator
      const [creator] = await db.select().from(users).where(eq(users.id, group.createdById));
      
      // Get members
      const membersQuery = await db.select({
          member: socialGroupMembers,
          user: users
        })
        .from(socialGroupMembers)
        .leftJoin(users, eq(socialGroupMembers.userId, users.id))
        .where(eq(socialGroupMembers.groupId, id));
      
      // Get posts
      const postsQuery = await db.select({
          post: socialPosts,
          author: users,
          commentCount: sql<number>`cast(count(distinct ${socialComments.id}) as int)`,
          reactionCount: sql<number>`cast(count(distinct ${socialReactions.id}) as int)`
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .leftJoin(socialComments, eq(socialPosts.id, socialComments.postId))
        .leftJoin(socialReactions, eq(socialPosts.id, socialReactions.postId))
        .where(eq(socialPosts.groupId, id))
        .groupBy(socialPosts.id, users.id)
        .orderBy(desc(socialPosts.createdAt))
        .limit(10);
      
      return { 
        success: true, 
        data: { 
          group,
          creator,
          members: membersQuery,
          posts: postsQuery,
          memberCount: membersQuery.length
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching group ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async createGroup(groupData: any): Promise<ServiceResult> {
    try {
      // Validate group data
      if (!groupData.name || !groupData.createdById) {
        return { success: false, error: 'Name and createdById are required fields' };
      }
      
      // Generate slug from name
      const slug = groupData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug is unique
      const [existingGroup] = await db.select().from(socialGroups).where(eq(socialGroups.slug, slug));
      
      if (existingGroup) {
        // Append a random string to make it unique
        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        groupData.slug = uniqueSlug;
      } else {
        groupData.slug = slug;
      }
      
      // Insert the group into the database
      const [group] = await db.insert(socialGroups).values({
        name: groupData.name,
        slug: groupData.slug,
        description: groupData.description || null,
        avatarUrl: groupData.avatarUrl || null,
        coverImageUrl: groupData.coverImageUrl || null,
        isPrivate: groupData.isPrivate !== undefined ? groupData.isPrivate : false,
        ageRestricted: groupData.ageRestricted !== undefined ? groupData.ageRestricted : false,
        minimumAge: groupData.minimumAge || null,
        createdById: groupData.createdById,
        settings: groupData.settings || null,
        membershipApproval: groupData.membershipApproval || 'automatic',
      }).returning();
      
      // Add the creator as an admin member
      await db.insert(socialGroupMembers).values({
        groupId: group.id,
        userId: groupData.createdById,
        role: 'admin'
      });
      
      return { success: true, data: group };
    } catch (error: any) {
      console.error('Error creating social group:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateGroup(id: number, groupData: any, userId: number): Promise<ServiceResult> {
    try {
      // Ensure the group exists
      const [existingGroup] = await db.select().from(socialGroups).where(eq(socialGroups.id, id));
      
      if (!existingGroup) {
        return { success: false, error: 'Group not found' };
      }
      
      // Check if user is an admin
      const [membership] = await db.select()
        .from(socialGroupMembers)
        .where(
          and(
            eq(socialGroupMembers.groupId, id),
            eq(socialGroupMembers.userId, userId),
            eq(socialGroupMembers.role, 'admin')
          )
        );
      
      if (!membership) {
        return { success: false, error: 'Only group admins can update the group' };
      }
      
      // Update slug if name changes
      let slug = existingGroup.slug;
      if (groupData.name && groupData.name !== existingGroup.name) {
        slug = groupData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Check if new slug is unique
        const [slugExists] = await db.select()
          .from(socialGroups)
          .where(and(eq(socialGroups.slug, slug), ne(socialGroups.id, id)));
        
        if (slugExists) {
          // Append a random string to make it unique
          slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }
      }
      
      // Update the group
      const [updatedGroup] = await db.update(socialGroups)
        .set({
          name: groupData.name !== undefined ? groupData.name : existingGroup.name,
          slug: groupData.slug !== undefined ? groupData.slug : slug,
          description: groupData.description !== undefined ? groupData.description : existingGroup.description,
          avatarUrl: groupData.avatarUrl !== undefined ? groupData.avatarUrl : existingGroup.avatarUrl,
          coverImageUrl: groupData.coverImageUrl !== undefined ? groupData.coverImageUrl : existingGroup.coverImageUrl,
          isPrivate: groupData.isPrivate !== undefined ? groupData.isPrivate : existingGroup.isPrivate,
          ageRestricted: groupData.ageRestricted !== undefined ? groupData.ageRestricted : existingGroup.ageRestricted,
          minimumAge: groupData.minimumAge !== undefined ? groupData.minimumAge : existingGroup.minimumAge,
          settings: groupData.settings !== undefined ? groupData.settings : existingGroup.settings,
          membershipApproval: groupData.membershipApproval !== undefined ? groupData.membershipApproval : existingGroup.membershipApproval,
          updatedAt: new Date(),
        })
        .where(eq(socialGroups.id, id))
        .returning();
      
      return { success: true, data: updatedGroup };
    } catch (error: any) {
      console.error(`Error updating group ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async joinGroup(groupId: number, userId: number, role: string = 'member'): Promise<ServiceResult> {
    try {
      // Check if group exists
      const [group] = await db.select().from(socialGroups).where(eq(socialGroups.id, groupId));
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }
      
      // Check if user is already a member
      const [existingMembership] = await db.select()
        .from(socialGroupMembers)
        .where(
          and(
            eq(socialGroupMembers.groupId, groupId),
            eq(socialGroupMembers.userId, userId)
          )
        );
      
      if (existingMembership) {
        return { success: false, error: 'User is already a member of this group' };
      }
      
      // Check user's age for age-restricted groups
      if (group.ageRestricted && group.minimumAge) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (user && user.dateOfBirth) {
          const age = this.calculateAge(new Date(user.dateOfBirth));
          if (age < group.minimumAge) {
            return { success: false, error: `You must be at least ${group.minimumAge} years old to join this group` };
          }
        }
      }
      
      // For private groups with manual approval, set status to 'pending'
      let status = 'active';
      if (group.isPrivate && group.membershipApproval === 'manual') {
        status = 'pending';
      }
      
      // Add user to group
      const [membership] = await db.insert(socialGroupMembers).values({
        groupId,
        userId,
        role: role === 'admin' ? 'admin' : 'member', // Only allow 'admin' if explicitly requested
        status,
      }).returning();
      
      return { 
        success: true, 
        data: { 
          membership,
          status
        } 
      };
    } catch (error: any) {
      console.error(`Error joining group ${groupId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async leaveGroup(groupId: number, userId: number): Promise<ServiceResult> {
    try {
      // Check if user is a member
      const [membership] = await db.select()
        .from(socialGroupMembers)
        .where(
          and(
            eq(socialGroupMembers.groupId, groupId),
            eq(socialGroupMembers.userId, userId)
          )
        );
      
      if (!membership) {
        return { success: false, error: 'User is not a member of this group' };
      }
      
      // Check if user is the only admin
      if (membership.role === 'admin') {
        const [{ count }] = await db
          .select({ count: sql`count(*)` })
          .from(socialGroupMembers)
          .where(
            and(
              eq(socialGroupMembers.groupId, groupId),
              eq(socialGroupMembers.role, 'admin')
            )
          );
        
        if (Number(count) === 1) {
          // Check if there are other members who could become admins
          const [{ count: memberCount }] = await db
            .select({ count: sql`count(*)` })
            .from(socialGroupMembers)
            .where(eq(socialGroupMembers.groupId, groupId));
          
          if (Number(memberCount) > 1) {
            return { success: false, error: 'You are the only admin. Please promote another member to admin before leaving.' };
          }
          
          // If this is the only member, delete the group
          await db.delete(socialPosts).where(eq(socialPosts.groupId, groupId));
          await db.delete(socialGroupMembers).where(eq(socialGroupMembers.groupId, groupId));
          await db.delete(socialGroups).where(eq(socialGroups.id, groupId));
          
          return { success: true, data: { message: 'Group deleted as you were the only member' } };
        }
      }
      
      // Remove user from group
      await db.delete(socialGroupMembers)
        .where(
          and(
            eq(socialGroupMembers.groupId, groupId),
            eq(socialGroupMembers.userId, userId)
          )
        );
      
      return { success: true, data: { message: 'Successfully left the group' } };
    } catch (error: any) {
      console.error(`Error leaving group ${groupId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteGroup(id: number, userId: number): Promise<ServiceResult> {
    try {
      // Check if user is an admin
      const [membership] = await db.select()
        .from(socialGroupMembers)
        .where(
          and(
            eq(socialGroupMembers.groupId, id),
            eq(socialGroupMembers.userId, userId),
            eq(socialGroupMembers.role, 'admin')
          )
        );
      
      if (!membership) {
        return { success: false, error: 'Only group admins can delete the group' };
      }
      
      // Delete all posts in the group
      await db.delete(socialPosts).where(eq(socialPosts.groupId, id));
      
      // Delete all memberships
      await db.delete(socialGroupMembers).where(eq(socialGroupMembers.groupId, id));
      
      // Delete the group
      const [deletedGroup] = await db.delete(socialGroups)
        .where(eq(socialGroups.id, id))
        .returning();
      
      if (!deletedGroup) {
        return { success: false, error: 'Group not found' };
      }
      
      return { success: true, data: { message: 'Group deleted successfully', id } };
    } catch (error: any) {
      console.error(`Error deleting group ${id}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Friendships =========== 
  
  async getFriends(userId: number): Promise<ServiceResult> {
    try {
      // Get all accepted friendships where the user is either userId or friendId
      const friendshipsQuery = db.select()
        .from(socialFriendships)
        .where(
          and(
            or(
              eq(socialFriendships.userId, userId),
              eq(socialFriendships.friendId, userId)
            ),
            eq(socialFriendships.status, 'accepted')
          )
        );
      
      const friendships = await friendshipsQuery;
      
      // Map to get the friend's userId (the other party in each friendship)
      const friends = await Promise.all(friendships.map(async (friendship) => {
        const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
        const [friend] = await db.select().from(users).where(eq(users.id, friendId));
        
        return {
          friendship,
          friend
        };
      }));
      
      return { success: true, data: { friends } };
    } catch (error: any) {
      console.error(`Error fetching friends for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async getFriendRequests(userId: number): Promise<ServiceResult> {
    try {
      // Get pending friend requests sent to the user
      const incomingRequestsQuery = db.select({
          friendship: socialFriendships,
          sender: users
        })
        .from(socialFriendships)
        .leftJoin(users, eq(socialFriendships.userId, users.id))
        .where(
          and(
            eq(socialFriendships.friendId, userId),
            eq(socialFriendships.status, 'pending')
          )
        );
      
      // Get pending friend requests sent by the user
      const outgoingRequestsQuery = db.select({
          friendship: socialFriendships,
          recipient: users
        })
        .from(socialFriendships)
        .leftJoin(users, eq(socialFriendships.friendId, users.id))
        .where(
          and(
            eq(socialFriendships.userId, userId),
            eq(socialFriendships.status, 'pending')
          )
        );
      
      const [incomingRequests, outgoingRequests] = await Promise.all([
        incomingRequestsQuery,
        outgoingRequestsQuery
      ]);
      
      return { 
        success: true, 
        data: { 
          incomingRequests,
          outgoingRequests
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching friend requests for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async sendFriendRequest(userId: number, friendId: number): Promise<ServiceResult> {
    try {
      // Validate IDs
      if (userId === friendId) {
        return { success: false, error: 'You cannot send a friend request to yourself' };
      }
      
      // Check if friend exists
      const [friend] = await db.select().from(users).where(eq(users.id, friendId));
      
      if (!friend) {
        return { success: false, error: 'User not found' };
      }
      
      // Check if a friendship already exists
      const [existingFriendship] = await db.select()
        .from(socialFriendships)
        .where(
          or(
            and(
              eq(socialFriendships.userId, userId),
              eq(socialFriendships.friendId, friendId)
            ),
            and(
              eq(socialFriendships.userId, friendId),
              eq(socialFriendships.friendId, userId)
            )
          )
        );
      
      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          return { success: false, error: 'You are already friends with this user' };
        }
        
        if (existingFriendship.status === 'pending') {
          if (existingFriendship.userId === userId) {
            return { success: false, error: 'You have already sent a friend request to this user' };
          } else {
            // The other user has already sent a request to this user, accept it
            return this.respondToFriendRequest(existingFriendship.id, 'accepted');
          }
        }
      }
      
      // Create the friend request
      const [friendship] = await db.insert(socialFriendships).values({
        userId,
        friendId,
        status: 'pending'
      }).returning();
      
      return { success: true, data: friendship };
    } catch (error: any) {
      console.error(`Error sending friend request from ${userId} to ${friendId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async respondToFriendRequest(friendshipId: number, response: 'accepted' | 'rejected'): Promise<ServiceResult> {
    try {
      // Check if friendship exists
      const [friendship] = await db.select().from(socialFriendships).where(eq(socialFriendships.id, friendshipId));
      
      if (!friendship) {
        return { success: false, error: 'Friend request not found' };
      }
      
      if (friendship.status !== 'pending') {
        return { success: false, error: 'This friend request has already been processed' };
      }
      
      if (response === 'accepted') {
        // Update the friendship status
        const [updatedFriendship] = await db.update(socialFriendships)
          .set({
            status: 'accepted',
            updatedAt: new Date(),
          })
          .where(eq(socialFriendships.id, friendshipId))
          .returning();
        
        return { success: true, data: updatedFriendship };
      } else {
        // Delete the friendship request
        await db.delete(socialFriendships).where(eq(socialFriendships.id, friendshipId));
        
        return { success: true, data: { message: 'Friend request rejected' } };
      }
    } catch (error: any) {
      console.error(`Error responding to friend request ${friendshipId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async removeFriend(userId: number, friendId: number): Promise<ServiceResult> {
    try {
      // Check if friendship exists
      const [friendship] = await db.select()
        .from(socialFriendships)
        .where(
          and(
            or(
              and(
                eq(socialFriendships.userId, userId),
                eq(socialFriendships.friendId, friendId)
              ),
              and(
                eq(socialFriendships.userId, friendId),
                eq(socialFriendships.friendId, userId)
              )
            ),
            eq(socialFriendships.status, 'accepted')
          )
        );
      
      if (!friendship) {
        return { success: false, error: 'You are not friends with this user' };
      }
      
      // Delete the friendship
      await db.delete(socialFriendships).where(eq(socialFriendships.id, friendship.id));
      
      return { success: true, data: { message: 'Friend removed successfully' } };
    } catch (error: any) {
      console.error(`Error removing friend ${friendId} from user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Messages =========== 
  
  async getConversations(userId: number): Promise<ServiceResult> {
    try {
      // Get all users this user has exchanged messages with
      const sentMessagesQuery = db.select({
          otherUserId: socialMessages.receiverId,
          lastMessageAt: sql<Date>`max(${socialMessages.createdAt})`
        })
        .from(socialMessages)
        .where(eq(socialMessages.senderId, userId))
        .groupBy(socialMessages.receiverId);
      
      const receivedMessagesQuery = db.select({
          otherUserId: socialMessages.senderId,
          lastMessageAt: sql<Date>`max(${socialMessages.createdAt})`
        })
        .from(socialMessages)
        .where(eq(socialMessages.receiverId, userId))
        .groupBy(socialMessages.senderId);
      
      const [sentMessages, receivedMessages] = await Promise.all([
        sentMessagesQuery,
        receivedMessagesQuery
      ]);
      
      // Combine and de-duplicate conversations
      const conversationMap = new Map();
      
      [...sentMessages, ...receivedMessages].forEach(({ otherUserId, lastMessageAt }) => {
        if (!conversationMap.has(otherUserId) || new Date(lastMessageAt) > new Date(conversationMap.get(otherUserId))) {
          conversationMap.set(otherUserId, lastMessageAt);
        }
      });
      
      // Convert to array and sort by most recent
      const conversationIds = Array.from(conversationMap.entries())
        .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
        .map(([id]) => id);
      
      // Get user info for each conversation
      const conversations = await Promise.all(
        conversationIds.map(async (id) => {
          const [user] = await db.select().from(users).where(eq(users.id, id));
          
          // Get the most recent message
          const [lastMessage] = await db.select()
            .from(socialMessages)
            .where(
              or(
                and(eq(socialMessages.senderId, userId), eq(socialMessages.receiverId, id)),
                and(eq(socialMessages.senderId, id), eq(socialMessages.receiverId, userId))
              )
            )
            .orderBy(desc(socialMessages.createdAt))
            .limit(1);
          
          // Count unread messages
          const [{ count }] = await db
            .select({ count: sql`count(*)` })
            .from(socialMessages)
            .where(
              and(
                eq(socialMessages.senderId, id),
                eq(socialMessages.receiverId, userId),
                eq(socialMessages.read, false)
              )
            );
          
          return {
            user,
            lastMessage,
            unreadCount: Number(count)
          };
        })
      );
      
      return { success: true, data: { conversations } };
    } catch (error: any) {
      console.error(`Error fetching conversations for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async getMessages(userId: number, otherUserId: number, options: { page?: number; limit?: number } = {}): Promise<ServiceResult> {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      // Get messages between these users
      const messagesQuery = db.select()
        .from(socialMessages)
        .where(
          or(
            and(eq(socialMessages.senderId, userId), eq(socialMessages.receiverId, otherUserId)),
            and(eq(socialMessages.senderId, otherUserId), eq(socialMessages.receiverId, userId))
          )
        )
        .orderBy(desc(socialMessages.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Count total messages
      const countQuery = db
        .select({ count: sql`count(*)` })
        .from(socialMessages)
        .where(
          or(
            and(eq(socialMessages.senderId, userId), eq(socialMessages.receiverId, otherUserId)),
            and(eq(socialMessages.senderId, otherUserId), eq(socialMessages.receiverId, userId))
          )
        );
      
      const [messages, [{ count }]] = await Promise.all([
        messagesQuery,
        countQuery
      ]);
      
      // Mark all messages from the other user as read
      await db.update(socialMessages)
        .set({ read: true })
        .where(
          and(
            eq(socialMessages.senderId, otherUserId),
            eq(socialMessages.receiverId, userId),
            eq(socialMessages.read, false)
          )
        );
      
      // Get other user's info
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      
      return { 
        success: true, 
        data: { 
          messages: messages.reverse(), // Reverse to show oldest first
          total: Number(count),
          page,
          limit,
          totalPages: Math.ceil(Number(count) / limit),
          otherUser
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching messages between ${userId} and ${otherUserId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async sendMessage(messageData: any): Promise<ServiceResult> {
    try {
      // Validate message data
      if (!messageData.content || !messageData.senderId || !messageData.receiverId) {
        return { success: false, error: 'Content, senderId, and receiverId are required fields' };
      }
      
      // Check if receiver exists
      const [receiver] = await db.select().from(users).where(eq(users.id, messageData.receiverId));
      
      if (!receiver) {
        return { success: false, error: 'Recipient not found' };
      }
      
      // Check if sender and receiver are friends (optional friend-only messaging)
      // Uncomment if you want to restrict messaging to friends only
      /*
      const [friendship] = await db.select()
        .from(socialFriendships)
        .where(
          and(
            or(
              and(
                eq(socialFriendships.userId, messageData.senderId),
                eq(socialFriendships.friendId, messageData.receiverId)
              ),
              and(
                eq(socialFriendships.userId, messageData.receiverId),
                eq(socialFriendships.friendId, messageData.senderId)
              )
            ),
            eq(socialFriendships.status, 'accepted')
          )
        );
      
      if (!friendship) {
        return { success: false, error: 'You can only message users who are your friends' };
      }
      */
      
      // Check for age restrictions if requested
      let ageRestricted = messageData.ageRestricted;
      
      if (messageData.checkAgeRestrictions) {
        try {
          const contentAnalysis = await this.aiService.analyzeContentForAgeRestrictions(messageData.content);
          
          if (contentAnalysis.success && contentAnalysis.data) {
            if (!contentAnalysis.data.isAppropriate) {
              ageRestricted = true;
            }
          }
        } catch (analysisError) {
          console.error('Error analyzing content for age restrictions:', analysisError);
          // Continue with message creation even if analysis fails
        }
      }
      
      // Send the message
      const [message] = await db.insert(socialMessages).values({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        attachments: messageData.attachments || null,
        read: false,
        ageRestricted: ageRestricted !== undefined ? ageRestricted : false,
      }).returning();
      
      return { success: true, data: message };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== News Feed =========== 
  
  async getNewsFeed(userId: number, options: { page?: number; limit?: number } = {}): Promise<ServiceResult> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      // Get user's friend IDs
      const friendshipsResult = await this.getFriends(userId);
      
      if (!friendshipsResult.success) {
        return friendshipsResult;
      }
      
      // Get all friend IDs
      const friendIds = friendshipsResult.data.friends
        .map(({ friend }) => friend?.id)
        .filter(id => id !== undefined) as number[];
      
      // Get user's group IDs
      const groupsQuery = await db.select({ groupId: socialGroupMembers.groupId })
        .from(socialGroupMembers)
        .where(eq(socialGroupMembers.userId, userId));
      
      const groupIds = groupsQuery.map(({ groupId }) => groupId);
      
      // Build the feed query
      let feedQuery = db.select({
          post: socialPosts,
          author: users,
          group: socialGroups,
          reactionCount: sql<number>`cast(count(distinct ${socialReactions.id}) as int)`,
          commentCount: sql<number>`cast(count(distinct ${socialComments.id}) as int)`
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .leftJoin(socialGroups, eq(socialPosts.groupId, socialGroups.id))
        .leftJoin(socialReactions, eq(socialPosts.id, socialReactions.postId))
        .leftJoin(socialComments, eq(socialPosts.id, socialComments.postId));
      
      // If the user has friends or groups, include content from them
      if (friendIds.length > 0 || groupIds.length > 0) {
        const conditions = [];
        
        if (friendIds.length > 0) {
          // Include posts from friends (public posts only)
          conditions.push(
            and(
              sql`${socialPosts.userId} IN (${friendIds.join(',')})`,
              eq(socialPosts.isPublic, true),
              isNull(socialPosts.groupId)
            )
          );
        }
        
        if (groupIds.length > 0) {
          // Include posts from groups the user is a member of
          conditions.push(
            sql`${socialPosts.groupId} IN (${groupIds.join(',')})`
          );
        }
        
        // Always include the user's own posts
        conditions.push(eq(socialPosts.userId, userId));
        
        feedQuery = feedQuery.where(or(...conditions));
      } else {
        // If user has no friends or groups, just show their own posts
        feedQuery = feedQuery.where(eq(socialPosts.userId, userId));
      }
      
      // Add grouping, ordering, pagination
      feedQuery = feedQuery
        .groupBy(socialPosts.id, users.id, socialGroups.id)
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset);
      
      const posts = await feedQuery;
      
      // Get user's reactions to these posts for UI state
      let userReactions = [];
      if (posts.length > 0) {
        const postIds = posts.map(({ post }) => post.id);
        
        userReactions = await db.select()
          .from(socialReactions)
          .where(
            and(
              sql`${socialReactions.postId} IN (${postIds.join(',')})`,
              eq(socialReactions.userId, userId)
            )
          );
      }
      
      // Get total count for pagination
      // This is a rough approximation as the exact count would be expensive
      let countQuery;
      
      if (friendIds.length > 0 || groupIds.length > 0) {
        const conditions = [];
        
        if (friendIds.length > 0) {
          conditions.push(
            and(
              sql`${socialPosts.userId} IN (${friendIds.join(',')})`,
              eq(socialPosts.isPublic, true),
              isNull(socialPosts.groupId)
            )
          );
        }
        
        if (groupIds.length > 0) {
          conditions.push(
            sql`${socialPosts.groupId} IN (${groupIds.join(',')})`
          );
        }
        
        conditions.push(eq(socialPosts.userId, userId));
        
        countQuery = db
          .select({ count: sql`count(*)` })
          .from(socialPosts)
          .where(or(...conditions));
      } else {
        countQuery = db
          .select({ count: sql`count(*)` })
          .from(socialPosts)
          .where(eq(socialPosts.userId, userId));
      }
      
      const [{ count }] = await countQuery;
      
      return { 
        success: true, 
        data: { 
          posts,
          userReactions,
          total: Number(count),
          page,
          limit,
          totalPages: Math.ceil(Number(count) / limit)
        } 
      };
    } catch (error: any) {
      console.error(`Error fetching news feed for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // =========== Utility Methods =========== 
  
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}