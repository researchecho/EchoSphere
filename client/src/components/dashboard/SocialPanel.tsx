import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
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
  MoreHorizontal,
  Loader2,
  Search,
  Bell,
  Settings,
  UserPlus,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Types for social network components
type SocialPost = {
  id: number;
  userId: number;
  content: string;
  attachments?: any;
  createdAt: string;
  isPublic: boolean;
  ageRestricted: boolean;
  author?: {
    id: number;
    username: string;
    fullName: string;
  };
  commentCount?: number;
  reactionCount?: number;
};

type SocialComment = {
  id: number;
  userId: number;
  postId: number;
  content: string;
  createdAt: string;
  author?: {
    id: number;
    username: string;
    fullName: string;
  };
  reactionCount?: number;
};

type SocialGroup = {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  memberCount: number;
  createdAt: string;
  isPublic: boolean;
};

type SocialUser = {
  id: number;
  username: string;
  fullName: string;
  profilePicture?: string | null;
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
};

export default function SocialPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('feed');
  const [postContent, setPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch feed posts
  const { 
    data: feedData, 
    isLoading: isLoadingFeed,
    refetch: refetchFeed
  } = useQuery({
    queryKey: ['/api/social/feed'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/social/feed');
      const json = await res.json();
      return json.data || { posts: [], userReactions: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  });

  // Fetch groups
  const { 
    data: groupsData, 
    isLoading: isLoadingGroups 
  } = useQuery({
    queryKey: ['/api/social/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/social/groups');
      const json = await res.json();
      return json.data?.groups || [];
    }
  });

  // Fetch users to follow
  const { 
    data: peopleData, 
    isLoading: isLoadingPeople 
  } = useQuery({
    queryKey: ['/api/social/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/social/users');
      const json = await res.json();
      return json.data?.users || [];
    }
  });

  // Fetch comments for a post
  const fetchComments = async (postId: number) => {
    if (expandedComments[postId]) {
      return;
    }
    
    try {
      const res = await apiRequest('GET', `/api/social/posts/${postId}/comments`);
      const json = await res.json();
      
      if (json.success) {
        // Store comments in query cache
        queryClient.setQueryData(['/api/social/posts', postId, 'comments'], json.data?.comments || []);
        // Mark comments as expanded for this post
        setExpandedComments(prev => ({ ...prev, [postId]: true }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Get comments for a specific post from cache
  const getCommentsForPost = (postId: number) => {
    return queryClient.getQueryData(['/api/social/posts', postId, 'comments']) || [];
  };

  // Create a new post
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', '/api/social/posts', {
        content,
        userId: 1, // Default user ID
        isPublic: true
      });
      return res.json();
    },
    onSuccess: () => {
      setPostContent('');
      refetchFeed();
      toast({
        title: 'Success',
        description: 'Your post has been published',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create post: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create a comment
  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const res = await apiRequest('POST', '/api/social/comments', {
        postId,
        content,
        userId: 1 // Default user ID
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Clear input
      setCommentInputs(prev => ({ ...prev, [variables.postId]: '' }));
      
      // Invalidate comments for the post
      queryClient.invalidateQueries({ 
        queryKey: ['/api/social/posts', variables.postId, 'comments'] 
      });
      
      // Refetch the post to update comment count
      fetchComments(variables.postId);
      
      // Also refetch the feed to update comment counts
      refetchFeed();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to add comment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Toggle reaction on a post
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ postId, type }: { postId: number; type: string }) => {
      const res = await apiRequest('POST', '/api/social/reactions', {
        postId,
        userId: 1, // Default user ID
        type
      });
      return res.json();
    },
    onSuccess: () => {
      // Refetch the feed to update reaction counts
      refetchFeed();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to react to post: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Join a group
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest('POST', `/api/social/groups/${groupId}/join`, {
        userId: 1 // Default user ID
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/groups'] });
      toast({
        title: 'Success',
        description: 'You have joined the group',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to join group: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Follow a user
  const followUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/social/users/${userId}/follow`, {
        followerId: 1 // Default user ID
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/users'] });
      toast({
        title: 'Success',
        description: 'You are now following this user',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to follow user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    createPostMutation.mutate(postContent);
  };

  const handleAddComment = (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    createCommentMutation.mutate({ postId, content });
  };

  const handleToggleReaction = (postId: number, type: string = 'like') => {
    toggleReactionMutation.mutate({ postId, type });
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleFollowUser = (userId: number) => {
    followUserMutation.mutate(userId);
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

  // Filter groups based on search query
  const filteredGroups = groupsData?.filter((group: SocialGroup) => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  ) || [];

  // Filter people based on search query
  const filteredPeople = peopleData?.filter((user: SocialUser) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Network</h2>
          <p className="text-muted-foreground">
            Connect with others, share ideas, and build communities in the Echoverse platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          {/* User profile card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-xl">U</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-xl">User Name</h3>
                <p className="text-muted-foreground text-sm">@username</p>
                <div className="flex mt-4 justify-center gap-4">
                  <div className="text-center">
                    <p className="font-bold">258</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">1.2K</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">425</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation links */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Users className="h-5 w-5 mr-3 text-primary" />
                  <span>My Friends</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Globe className="h-5 w-5 mr-3 text-primary" />
                  <span>Discover</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Bookmark className="h-5 w-5 mr-3 text-primary" />
                  <span>Saved Posts</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Bell className="h-5 w-5 mr-3 text-primary" />
                  <span>Notifications</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Settings className="h-5 w-5 mr-3 text-primary" />
                  <span>Social Settings</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">News Feed</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>

            {/* News Feed Tab */}
            <TabsContent value="feed" className="space-y-4">
              {/* Create Post Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarFallback>U</AvatarFallback>
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
                          disabled={!postContent.trim() || createPostMutation.isPending}
                        >
                          {createPostMutation.isPending ? (
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

              {/* Posts */}
              {isLoadingFeed ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : feedData?.posts?.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground mb-4">No posts yet. Be the first to share something!</p>
                    <Button onClick={() => document.querySelector('textarea')?.focus()}>
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                feedData?.posts?.map((post: SocialPost) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {post.author?.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{post.author?.fullName || post.author?.username || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {post.ageRestricted && (
                            <Badge variant="destructive" className="mr-2">18+</Badge>
                          )}
                          {!post.isPublic && (
                            <Badge variant="outline" className="mr-2">Private</Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Save Post</DropdownMenuItem>
                              <DropdownMenuItem>Report Post</DropdownMenuItem>
                              {post.userId === 1 && (
                                <DropdownMenuItem className="text-destructive">Delete Post</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      {post.attachments && (
                        <div className="mt-3">
                          {/* Render attachments if any */}
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
                            <span>{post.reactionCount || ''}</span>
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
                            onClick={() => fetchComments(post.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>{post.commentCount || ''}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Comments section */}
                      {expandedComments[post.id] && (
                        <div className="w-full space-y-3 border-t pt-3">
                          {getCommentsForPost(post.id).map((comment: SocialComment) => (
                            <div key={comment.id} className="flex space-x-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">
                                  {comment.author?.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg p-2">
                                  <p className="text-sm font-medium">
                                    {comment.author?.fullName || comment.author?.username || 'Unknown User'}
                                  </p>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(comment.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add comment form */}
                          <div className="flex items-center space-x-2 pt-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">U</AvatarFallback>
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
                                disabled={!commentInputs[post.id]?.trim() || createCommentMutation.isPending}
                              >
                                {createCommentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!expandedComments[post.id] && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground self-start"
                          onClick={() => fetchComments(post.id)}
                        >
                          {post.commentCount > 0 
                            ? `View ${post.commentCount} ${post.commentCount === 1 ? 'comment' : 'comments'}`
                            : 'Add a comment'
                          }
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Discover Groups</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Group
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search groups..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingGroups ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <p className="text-muted-foreground">No groups found</p>
                      <Button className="mt-4">Create a New Group</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredGroups.map((group: SocialGroup) => (
                        <Card key={group.id} className="overflow-hidden">
                          <div className="h-24 bg-gradient-to-r from-blue-600 to-violet-600"></div>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{group.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={joinGroupMutation.isPending}
                              >
                                {joinGroupMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Join'
                                )}
                              </Button>
                            </div>
                            {group.description && (
                              <p className="text-sm mt-2 line-clamp-2">{group.description}</p>
                            )}
                            <div className="flex items-center mt-3 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3 mr-1" />
                              <span>{group.isPublic ? 'Public' : 'Private'} Group</span>
                              <span className="mx-2">•</span>
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Created {formatDate(group.createdAt).split(',')[0]}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* People Tab */}
            <TabsContent value="people" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>People You May Know</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPeople ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredPeople.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPeople.map((user: SocialUser) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.profilePicture || undefined} />
                              <AvatarFallback>{user.username.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName || user.username}</p>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              {user.bio && (
                                <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFollowUser(user.id)}
                            disabled={followUserMutation.isPending}
                          >
                            {followUserMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Follow
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}