import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  MessageSquare, 
  ThumbsUp, 
  Heart, 
  Send, 
  User, 
  Users, 
  Globe, 
  Bookmark,
  Calendar,
  Share2,
  MoreHorizontal
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Post {
  post: {
    id: number;
    userId: number;
    content: string;
    attachments?: any;
    createdAt: string;
    isPublic: boolean;
    ageRestricted: boolean;
  };
  author: {
    id: number;
    username: string;
    fullName: string;
  } | null;
  reactionCount: number;
  commentCount: number;
}

interface Comment {
  comment: {
    id: number;
    userId: number;
    content: string;
    createdAt: string;
  };
  author: {
    id: number;
    username: string;
    fullName: string;
  } | null;
  reactionCount: number;
}

interface NewsFeedResponse {
  posts: Post[];
  userReactions: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Group {
  group: {
    id: number;
    name: string;
    description: string | null;
    slug: string;
    memberCount: number;
    createdAt: string;
  }
}

const SocialPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoading, setIsLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [feed, setFeed] = useState<NewsFeedResponse | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch news feed
  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", "/api/social/feed");
        const data = await response.json();
        if (data.success) {
          setFeed(data.data);
        }
      } catch (error) {
        console.error("Error fetching feed:", error);
        toast({
          title: "Error",
          description: "Failed to load news feed",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, [toast]);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await apiRequest("GET", "/api/social/groups");
        const data = await response.json();
        if (data.success) {
          setGroups(data.data.groups);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // Create a new post
  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/social/posts", {
        content: postContent,
        userId: 1, // Default user
        isPublic: true
      });
      
      const data = await response.json();
      if (data.success) {
        setPostContent('');
        // Refetch the feed to show the new post
        const feedResponse = await apiRequest("GET", "/api/social/feed");
        const feedData = await feedResponse.json();
        if (feedData.success) {
          setFeed(feedData.data);
        }
        
        toast({
          title: "Success",
          description: "Post created successfully"
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create post",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load comments for a post
  const loadComments = async (postId: number) => {
    if (loadingComments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await apiRequest("GET", `/api/social/posts/${postId}`);
      const data = await response.json();
      
      if (data.success && data.data.comments) {
        setComments(prev => ({ ...prev, [postId]: data.data.comments }));
      }
    } catch (error) {
      console.error(`Error loading comments for post ${postId}:`, error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add a comment to a post
  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    
    try {
      const response = await apiRequest("POST", "/api/social/comments", {
        content,
        postId,
        userId: 1 // Default user
      });
      
      const data = await response.json();
      if (data.success) {
        // Clear the input and reload comments
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        await loadComments(postId);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add comment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  // Toggle like/reaction on a post
  const handleToggleReaction = async (postId: number, type: string = 'like') => {
    try {
      const response = await apiRequest("POST", "/api/social/reactions", {
        postId,
        userId: 1, // Default user
        type
      });
      
      const data = await response.json();
      if (data.success) {
        // Refetch the feed to update reaction counts
        const feedResponse = await apiRequest("GET", "/api/social/feed");
        const feedData = await feedResponse.json();
        if (feedData.success) {
          setFeed(feedData.data);
        }
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Echoverse Social</CardTitle>
          <CardDescription>
            Connect with others in the Echoverse community
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="feed">News Feed</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>
            
            {/* News Feed Tab */}
            <TabsContent value="feed" className="flex-1 h-full flex flex-col space-y-4 overflow-auto">
              {/* Create Post Area */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="resize-none mb-3"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleCreatePost} 
                          disabled={!postContent.trim() || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            'Post'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Posts Feed */}
              <div className="space-y-4 pb-4">
                {isLoading && !feed ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : feed?.posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center p-6">
                      <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
                    </CardContent>
                  </Card>
                ) : (
                  feed?.posts.map(({ post, author, commentCount, reactionCount }) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {author?.username.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{author?.fullName || author?.username || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Report Post</DropdownMenuItem>
                              <DropdownMenuItem>Hide Post</DropdownMenuItem>
                              {post.userId === 1 && (
                                <DropdownMenuItem>Delete Post</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                        {post.attachments && (
                          <div className="mt-3">
                            {/* Render attachments here if post has any */}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex flex-col pb-3 border-t px-6 pt-3">
                        <div className="flex justify-between items-center w-full mb-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => handleToggleReaction(post.id, 'like')}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span>{reactionCount || ''}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-red-500"
                              onClick={() => handleToggleReaction(post.id, 'love')}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground"
                              onClick={() => loadComments(post.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span>{commentCount || ''}</span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Comments Section */}
                        {comments[post.id] && (
                          <div className="w-full space-y-3 border-t pt-3">
                            {comments[post.id].map(({ comment, author }) => (
                              <div key={comment.id} className="flex space-x-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs">
                                    {author?.username.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted rounded-lg p-2">
                                    <p className="text-sm font-medium">
                                      {author?.fullName || author?.username || 'Unknown User'}
                                    </p>
                                    <p className="text-sm">{comment.content}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(comment.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            
                            {/* Add Comment Form */}
                            <div className="flex items-center space-x-2 pt-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex items-center space-x-2">
                                <Input
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => 
                                    setCommentInputs(prev => ({ 
                                      ...prev, 
                                      [post.id]: e.target.value 
                                    }))
                                  }
                                  placeholder="Write a comment..."
                                  className="text-sm"
                                />
                                <Button 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!commentInputs[post.id]?.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {loadingComments[post.id] && (
                          <div className="flex justify-center p-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        
                        {!comments[post.id] && !loadingComments[post.id] && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground self-start"
                            onClick={() => loadComments(post.id)}
                          >
                            {commentCount > 0 ? `View comments (${commentCount})` : "Add a comment"}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            {/* Groups Tab */}
            <TabsContent value="groups" className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingGroups ? (
                  <div className="col-span-full flex justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : groups?.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="text-center p-6">
                        <p className="text-muted-foreground mb-4">No groups found</p>
                        <Button>Create a Group</Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  groups?.map(({ group }) => (
                    <Card key={group.id} className="overflow-hidden">
                      <div className="h-28 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Join
                          </Button>
                        </div>
                        {group.description && (
                          <p className="text-sm mt-2 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center mt-3 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3 mr-1" />
                          <span>Public Group</span>
                          <span className="mx-2">•</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Created {formatDate(group.createdAt).split(',')[0]}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialPanel;