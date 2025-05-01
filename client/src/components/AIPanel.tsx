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
import { Loader2, Send, Plus, User, Bot, Trash2, MessageSquare } from "lucide-react";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Agent {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  systemPrompt: string;
}

interface Conversation {
  id: number;
  title: string;
  agentId: number;
  createdAt: string;
}

const AIPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [supportInput, setSupportInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [supportResponse, setSupportResponse] = useState<string | null>(null);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await apiRequest("GET", "/api/ai/agents");
        const data = await response.json();
        
        if (data.success) {
          setAgents(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    fetchAgents();
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConversations(true);
      try {
        const response = await apiRequest("GET", "/api/ai/conversations");
        const data = await response.json();
        
        if (data.success) {
          setConversations(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages for the active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const response = await apiRequest("GET", `/api/ai/conversations/${activeConversation}/messages`);
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [activeConversation]);

  // Handle send message to AI agent
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || !activeConversation) return;
    
    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      role: 'user' as 'user',
      content: userInput,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    try {
      const response = await apiRequest("POST", `/api/ai/conversations/${activeConversation}/messages`, {
        content: userMessage.content
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add AI response from the server
        if (data.data && data.data.aiMessage) {
          setMessages(prev => [...prev, data.data.aiMessage]);
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to get AI response",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to communicate with AI agent",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new conversation
  const handleNewConversation = async () => {
    if (agents.length === 0) {
      toast({
        title: "No Agents Available",
        description: "Please create an agent first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Use the first agent as default
      const response = await apiRequest("POST", "/api/ai/conversations", {
        agentId: agents[0].id,
        userId: 1 // Using a default user ID
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Add the new conversation to the list
        setConversations(prev => [data.data, ...prev]);
        setActiveConversation(data.data.id);
        setMessages([]);
        
        toast({
          title: "Conversation Created",
          description: "New conversation started with " + agents[0].name
        });
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation",
        variant: "destructive"
      });
    }
  };

  // Get support chatbot response
  const handleSupportRequest = async () => {
    if (!supportInput.trim() || isSupportLoading) return;
    
    setIsSupportLoading(true);
    setSupportResponse(null);
    
    try {
      const response = await apiRequest("POST", "/api/ai/support", {
        message: supportInput
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSupportResponse(data.data.response);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to get support response",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error getting support:", error);
      toast({
        title: "Error",
        description: "Failed to communicate with support chatbot",
        variant: "destructive"
      });
    } finally {
      setIsSupportLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Echoverse AI</CardTitle>
          <CardDescription>
            Interact with AI agents and get support for the Echoverse platform
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="chat">AI Agents</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>
            
            {/* AI Agents Tab */}
            <TabsContent value="chat" className="flex-1 flex h-full space-x-4">
              {/* Conversations List */}
              <div className="w-1/4 flex flex-col h-full border rounded-md">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Conversations</h3>
                  <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {loadingConversations ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      <p>No conversations yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleNewConversation}>
                        Start a conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div 
                          key={conversation.id}
                          className={`p-2 rounded-md cursor-pointer hover:bg-muted flex items-center ${activeConversation === conversation.id ? 'bg-muted' : ''}`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div className="truncate flex-1">
                            {conversation.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="flex-1 flex flex-col h-full border rounded-md">
                {!activeConversation ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg">No conversation selected</h3>
                      <p className="text-muted-foreground mb-4">Select a conversation or start a new one</p>
                      <Button onClick={handleNewConversation}>
                        Start a new conversation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">
                          <p>This is the start of your conversation.</p>
                          <p>Send a message to begin!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`flex max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                                {message.role === 'user' ? (
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                ) : (
                                  <AvatarFallback>
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div 
                                className={`rounded-lg p-3 ${
                                  message.role === 'user' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="flex">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg p-3 bg-muted flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex space-x-2"
                      >
                        <Input
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Type a message..."
                          disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            {/* Support Tab */}
            <TabsContent value="support" className="flex-1 h-full flex flex-col">
              <div className="flex-1 overflow-auto border rounded-md p-4 mb-4">
                <div className="flex items-start mb-4">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg">
                    <p>
                      Hi there! I'm your Echoverse Support Assistant. How can I help you today?
                    </p>
                  </div>
                </div>
                
                {supportInput && (
                  <div className="flex items-start justify-end mb-4">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                      <p>{supportInput}</p>
                    </div>
                    <Avatar className="h-8 w-8 ml-3">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                {isSupportLoading && (
                  <div className="flex items-start mb-4">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Thinking...</span>
                    </div>
                  </div>
                )}
                
                {supportResponse && (
                  <div className="flex items-start mb-4">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="whitespace-pre-wrap">{supportResponse}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSupportRequest();
                }}
                className="flex space-x-2"
              >
                <Textarea
                  value={supportInput}
                  onChange={(e) => setSupportInput(e.target.value)}
                  placeholder="Ask the Echoverse support chatbot..."
                  disabled={isSupportLoading}
                  className="resize-none"
                  rows={3}
                />
                <Button 
                  type="submit" 
                  disabled={isSupportLoading || !supportInput.trim()} 
                  className="self-end"
                >
                  {isSupportLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPanel;