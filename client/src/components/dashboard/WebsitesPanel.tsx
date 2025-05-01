import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  LucideSearch, 
  LucideGlobe, 
  LucidePlus, 
  LucideEdit, 
  LucideTrash, 
  LucideMoreHorizontal,
  LucideExternalLink,
  LucideEye,
  LucideCode,
  LucideStar,
  LucideSettings,
  LucideLoader
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Website type from API
interface Website {
  id: number;
  userId: number;
  name: string;
  domain: string | null;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

// Response type for websites API
interface WebsitesResponse {
  websites: Website[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Website status type (derived from settings)
type WebsiteStatus = 'live' | 'draft' | 'archived';

export default function WebsitesPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddWebsiteDialogOpen, setIsAddWebsiteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newWebsite, setNewWebsite] = useState({
    userId: 1, // Default to first user, in a real app this would be the current user's ID
    name: '',
    domain: '',
    settings: {
      status: 'draft' as WebsiteStatus,
      template: 'business-premium',
      thumbnail: ''
    }
  });

  // Fetch websites
  const { data, isLoading, error } = useQuery<WebsitesResponse>({
    queryKey: ['/api/websites'],
  });

  // Create website mutation
  const createWebsiteMutation = useMutation({
    mutationFn: (websiteData: typeof newWebsite) => {
      return apiRequest('POST', '/api/websites', websiteData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Website created successfully',
      });
      setIsAddWebsiteDialogOpen(false);
      setNewWebsite({
        userId: 1,
        name: '',
        domain: '',
        settings: {
          status: 'draft' as WebsiteStatus,
          template: 'business-premium',
          thumbnail: ''
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create website: ${err.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete website mutation
  const deleteWebsiteMutation = useMutation({
    mutationFn: (websiteId: number) => {
      return apiRequest('DELETE', `/api/websites/${websiteId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Website deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedWebsite(null);
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete website: ${err.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update website status mutation
  const updateWebsiteMutation = useMutation({
    mutationFn: ({ websiteId, data }: { websiteId: number, data: Partial<Website> }) => {
      return apiRequest('PATCH', `/api/websites/${websiteId}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Website updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update website: ${err.message}`,
        variant: 'destructive',
      });
    }
  });

  // Get website status (from settings)
  const getWebsiteStatus = (website: Website): WebsiteStatus => {
    return website.settings?.status || 'draft';
  };

  // Get website template (from settings)
  const getWebsiteTemplate = (website: Website): string => {
    return website.settings?.template || 'Default Template';
  };

  // Create website url
  const getWebsiteUrl = (website: Website): string => {
    return website.domain || `${website.name.toLowerCase().replace(/\s+/g, '-')}.echoverse.com`;
  };

  // Handle new website form change
  const handleNewWebsiteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'template') {
      setNewWebsite(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          template: value
        }
      }));
    } else {
      setNewWebsite(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle new website creation
  const handleCreateWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    createWebsiteMutation.mutate(newWebsite);
  };

  // Handle website deletion
  const handleDeleteWebsite = () => {
    if (selectedWebsite) {
      deleteWebsiteMutation.mutate(selectedWebsite.id);
    }
  };

  // Update website status
  const updateWebsiteStatus = (websiteId: number, newStatus: WebsiteStatus) => {
    if (!data) return;
    
    const website = data.websites.find(w => w.id === websiteId);
    if (!website) return;
    
    updateWebsiteMutation.mutate({
      websiteId,
      data: {
        settings: {
          ...website.settings,
          status: newStatus
        }
      }
    });
  };

  // Filter websites based on search query and active tab
  const filteredWebsites = data?.websites.filter((website) => {
    if (!website) return false;

    const query = searchQuery.toLowerCase();
    const status = getWebsiteStatus(website);
    const templateName = getWebsiteTemplate(website);
    const websiteUrl = getWebsiteUrl(website);
    
    const matchesSearch = 
      website.name.toLowerCase().includes(query) ||
      websiteUrl.toLowerCase().includes(query) ||
      templateName.toLowerCase().includes(query);
    
    if (activeTab === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && status === activeTab;
    }
  }) || [];

  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Get count of websites by status
  const getLiveCount = () => data?.websites.filter(w => getWebsiteStatus(w) === 'live').length || 0;
  const getDraftCount = () => data?.websites.filter(w => getWebsiteStatus(w) === 'draft').length || 0;
  const getArchivedCount = () => data?.websites.filter(w => getWebsiteStatus(w) === 'archived').length || 0;

  // Get status badge variant
  const getStatusBadgeVariant = (status: WebsiteStatus) => {
    switch (status) {
      case 'live':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Websites</h2>
          <p className="text-muted-foreground">Manage your websites and domains.</p>
        </div>
        <Button onClick={() => setIsAddWebsiteDialogOpen(true)}>
          <LucidePlus className="mr-2 h-4 w-4" />
          New Website
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
            <LucideGlobe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <LucideLoader className="animate-spin h-4 w-4 inline" /> : data?.websites.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all statuses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Live Sites</CardTitle>
            <LucideStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <LucideLoader className="animate-spin h-4 w-4 inline" /> : getLiveCount()}
            </div>
            <p className="text-xs text-green-500 mt-1">
              Active and published websites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Development</CardTitle>
            <LucideCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <LucideLoader className="animate-spin h-4 w-4 inline" /> : getDraftCount()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Drafts and works in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Sites</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search websites..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredWebsites.map((website) => (
              <WebsiteCard 
                key={website.id}
                website={website}
                onEdit={() => {}}
                onView={() => {}}
                onDelete={() => {
                  setSelectedWebsite(website);
                  setIsDeleteDialogOpen(true);
                }}
                onUpdateStatus={updateWebsiteStatus}
              />
            ))}
            {filteredWebsites.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No websites found. Try a different search term or create a new website.
              </div>
            )}
          </div>
        </TabsContent>

        {['live', 'draft', 'archived'].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredWebsites.map((website) => (
                <WebsiteCard 
                  key={website.id}
                  website={website}
                  onEdit={() => {}}
                  onView={() => {}}
                  onDelete={() => {
                    setSelectedWebsite(website);
                    setIsDeleteDialogOpen(true);
                  }}
                  onUpdateStatus={updateWebsiteStatus}
                />
              ))}
              {filteredWebsites.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No {status} websites found. Try a different search term.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete website confirmation dialog */}
      {selectedWebsite && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete the "{selectedWebsite.name}" website and all its content.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDeleteWebsite}>
                Delete Website
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Website Dialog */}
      <Dialog open={isAddWebsiteDialogOpen} onOpenChange={setIsAddWebsiteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Website</DialogTitle>
            <DialogDescription>
              Set up your new website. You can customize it further after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebsite}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input 
                  id="name" 
                  name="name"
                  className="col-span-3" 
                  placeholder="My Awesome Website" 
                  value={newWebsite.name}
                  onChange={handleNewWebsiteChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="domain" className="text-right">
                  Domain
                </label>
                <div className="col-span-3 flex items-center border rounded-md">
                  <Input 
                    id="domain" 
                    name="domain"
                    className="border-0" 
                    placeholder="my-site" 
                    value={newWebsite.domain}
                    onChange={handleNewWebsiteChange}
                  />
                  <span className="pr-3 text-muted-foreground">.echoverse.com</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="template" className="text-right">
                  Template
                </label>
                <select 
                  id="template" 
                  name="template"
                  className="col-span-3 p-2 border rounded-md"
                  value={newWebsite.settings.template}
                  onChange={handleNewWebsiteChange}
                >
                  <option value="business-premium">Business Premium</option>
                  <option value="portfolio-pro">Portfolio Pro</option>
                  <option value="blog-standard">Blog Standard</option>
                  <option value="ecommerce-basic">E-commerce Basic</option>
                  <option value="event-special">Event Special</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={createWebsiteMutation.isPending}
              >
                {createWebsiteMutation.isPending ? (
                  <>
                    <LucideLoader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Website'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Website Card Component
interface WebsiteCardProps {
  website: Website;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onUpdateStatus: (id: number, status: WebsiteStatus) => void;
}

function WebsiteCard({ website, onEdit, onView, onDelete, onUpdateStatus }: WebsiteCardProps) {
  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Extract website data from settings
  const getWebsiteStatus = (): WebsiteStatus => {
    return website.settings?.status || 'draft';
  };
  
  const getWebsiteTemplate = (): string => {
    return website.settings?.template || 'Default Template';
  };
  
  const getWebsiteThumbnail = (): string => {
    return website.settings?.thumbnail || '';
  };
  
  const getWebsiteUrl = (): string => {
    return website.domain || `${website.name.toLowerCase().replace(/\s+/g, '-')}.echoverse.com`;
  };
  
  const status = getWebsiteStatus();
  
  const getStatusBadgeVariant = (status: WebsiteStatus) => {
    switch (status) {
      case 'live':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };
  
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="h-32 bg-muted relative">
        {getWebsiteThumbnail() ? (
          <div className="h-full w-full bg-gray-300 flex items-center justify-center">
            <LucideGlobe className="h-10 w-10 text-gray-400" />
          </div>
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <LucideGlobe className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <Badge 
          className="absolute top-2 right-2" 
          variant={getStatusBadgeVariant(status) as any}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg mb-1">{website.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {getWebsiteUrl()}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Last updated: {formatDate(website.updatedAt)}
        </p>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onView}>
            <LucideEye className="h-4 w-4 mr-1" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <LucideMoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit}>
                <LucideEdit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onView}>
                <LucideExternalLink className="h-4 w-4 mr-2" />
                Visit Site
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <LucideSettings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {status !== 'live' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(website.id, 'live')}>
                  <LucideStar className="h-4 w-4 mr-2" />
                  Publish Site
                </DropdownMenuItem>
              )}
              
              {status !== 'draft' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(website.id, 'draft')}>
                  <LucideCode className="h-4 w-4 mr-2" />
                  Set as Draft
                </DropdownMenuItem>
              )}
              
              {status !== 'archived' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(website.id, 'archived')}>
                  <LucideArchive className="h-4 w-4 mr-2" />
                  Archive Site
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <LucideTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function LucideArchive(props: React.ComponentProps<typeof LucideTrash>) {
  return <LucideTrash {...props} />;
}