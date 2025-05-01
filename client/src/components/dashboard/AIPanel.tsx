import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bot, Plus, Settings, Trash2, Send, MessageSquare, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

// Types for AI components
type AIModel = {
  id: number;
  name: string;
  provider: string;
  capabilities: string[];
  contextLength: number;
  isActive: boolean;
};

type AIAgent = {
  id: number;
  name: string;
  description: string;
  systemPrompt: string;
  modelId: number;
  isPublic: boolean;
  model?: AIModel;
};

type AIConversation = {
  id: number;
  agentId: number;
  title: string;
  createdAt: string;
  agent?: AIAgent;
  messages?: AIMessage[];
};

type AIMessage = {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export default function AIPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFormOpen, setAgentFormOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<{
    name: string;
    description: string;
    systemPrompt: string;
    modelId: number;
  }>({
    name: '',
    description: '',
    systemPrompt: '',
    modelId: 1, // Default model ID
  });

  // Fetch AI agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['/api/ai/agents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/ai/agents');
      const json = await res.json();
      return json.data?.agents || [];
    },
  });

  // Fetch AI models
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['/api/ai/models'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/ai/models');
      const json = await res.json();
      return json.data?.models || [];
    },
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/ai/conversations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/ai/conversations');
      const json = await res.json();
      return json.data?.conversations || [];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/ai/conversations', selectedConversation, 'messages'],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await apiRequest('GET', `/api/ai/conversations/${selectedConversation}/messages`);
      const json = await res.json();
      return json.data?.messages || [];
    },
    enabled: !!selectedConversation,
  });

  // Create a new agent
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: typeof newAgent) => {
      const res = await apiRequest('POST', '/api/ai/agents', agentData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
      setAgentFormOpen(false);
      setNewAgent({
        name: '',
        description: '',
        systemPrompt: '',
        modelId: 1,
      });
      toast({
        title: 'Success',
        description: 'AI Agent created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create AI Agent: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const res = await apiRequest('POST', '/api/ai/conversations', { 
        agentId,
        title: 'New Conversation',
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversations'] });
      setSelectedConversation(data.data.conversation.id);
      setActiveTab('conversations');
      toast({
        title: 'Success',
        description: 'New conversation started',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create conversation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/ai/conversations/${conversationId}/messages`, {
        content,
        role: 'user',
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ai/conversations', selectedConversation, 'messages'] 
      });
      setMessageInput('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const res = await apiRequest('DELETE', `/api/ai/conversations/${conversationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversations'] });
      if (selectedConversation) {
        setSelectedConversation(null);
      }
      toast({
        title: 'Success',
        description: 'Conversation deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete conversation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete an agent
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const res = await apiRequest('DELETE', `/api/ai/agents/${agentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
      toast({
        title: 'Success',
        description: 'AI Agent deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete agent: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput,
    });
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    createAgentMutation.mutate(newAgent);
  };

  const filteredConversations = conversations.filter((conv: AIConversation) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgents = agents.filter((agent: AIAgent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversationData = conversations.find(
    (conv: AIConversation) => conv.id === selectedConversation
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Omnilayer</h2>
          <p className="text-muted-foreground">
            Manage your AI assistants, create custom workflows, and chat with your AI agents.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="flex space-x-4 h-[calc(100vh-250px)]">
            {/* Conversations sidebar */}
            <Card className="w-80 flex flex-col">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Conversations</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setActiveTab('agents');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2 flex-grow overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-20" />
                    <p>No conversations found</p>
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab('agents')}
                      className="mt-2"
                    >
                      Create a new conversation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation: AIConversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          selectedConversation === conversation.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Bot className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium truncate max-w-[160px]">
                              {conversation.title || 'New Conversation'}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <span className="sr-only">Open menu</span>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversationMutation.mutate(conversation.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat area */}
            <Card className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="p-4 border-b">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{selectedConversationData?.agent?.name?.[0] || 'A'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedConversationData?.agent?.name || 'AI Assistant'}</CardTitle>
                        <CardDescription className="text-xs">
                          {selectedConversationData?.agent?.model?.provider || 'Echoverse AI'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow overflow-y-auto">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bot className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">How can I help you today?</p>
                        <p className="text-sm mt-2">Start by sending a message.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((message: AIMessage) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground ml-auto'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs mt-1 opacity-70 text-right">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t">
                    <div className="flex w-full items-center space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a conversation or start a new one with an AI agent
                    </p>
                    <Button
                      onClick={() => setActiveTab('agents')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search AI agents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setAgentFormOpen(!agentFormOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              {agentFormOpen ? 'Cancel' : 'Create Agent'}
            </Button>
          </div>

          {agentFormOpen && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New AI Agent</CardTitle>
                <CardDescription>Configure a new AI assistant for your tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAgent} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input
                        id="name"
                        placeholder="E.g., Customer Support Assistant"
                        value={newAgent.name}
                        onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <Input
                        id="description"
                        placeholder="What this agent does"
                        value={newAgent.description}
                        onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="systemPrompt" className="text-sm font-medium">System Prompt</label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="You are a helpful assistant that..."
                        value={newAgent.systemPrompt}
                        onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="modelId" className="text-sm font-medium">AI Model</label>
                      <select
                        id="modelId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newAgent.modelId}
                        onChange={(e) => setNewAgent({ ...newAgent, modelId: parseInt(e.target.value) })}
                        required
                      >
                        {isLoadingModels ? (
                          <option>Loading models...</option>
                        ) : models.length === 0 ? (
                          <option>No models available</option>
                        ) : (
                          models.map((model: AIModel) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createAgentMutation.isPending}
                  >
                    {createAgentMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create AI Agent
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingAgents ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="opacity-50">
                  <CardHeader className="p-4">
                    <div className="bg-muted rounded h-6 w-3/4 mb-2"></div>
                    <div className="bg-muted rounded h-4 w-1/2"></div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="bg-muted rounded h-4 w-full mb-2"></div>
                    <div className="bg-muted rounded h-4 w-5/6"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredAgents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-medium mb-2">No AI Agents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first AI agent to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setAgentFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                )}
              </div>
            ) : (
              filteredAgents.map((agent: AIAgent) => (
                <Card key={agent.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              deleteAgentMutation.mutate(agent.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>
                      {agent.model?.name || 'Custom AI Assistant'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {agent.description || 'No description provided'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {agent.model?.capabilities?.map((capability, index) => (
                        <Badge key={index} variant="outline">{capability}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="p-4">
                    <Button 
                      className="w-full" 
                      onClick={() => createConversationMutation.mutate(agent.id)}
                      disabled={createConversationMutation.isPending}
                    >
                      {createConversationMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Chat with {agent.name}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}