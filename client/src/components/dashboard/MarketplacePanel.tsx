
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Download, ShoppingCart } from 'lucide-react';

type MarketplaceItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  rating: number;
  downloadCount: number;
};

export default function MarketplacePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['marketplace', searchQuery],
    queryFn: () => apiRequest.get(`/api/marketplace/search?q=${searchQuery}`),
  });

  const purchaseMutation = useMutation({
    mutationFn: (itemId: number) => 
      apiRequest.post(`/api/marketplace/purchase/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      toast({
        title: 'Purchase successful',
        description: 'Item has been added to your library',
      });
    },
  });

  const installMutation = useMutation({
    mutationFn: (itemId: number) => 
      apiRequest.post(`/api/marketplace/install/${itemId}`),
    onSuccess: () => {
      toast({
        title: 'Installation successful',
        description: 'Asset has been installed in your project',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Marketplace</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10 w-[300px]"
              placeholder="Search marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ai-agents">AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item: MarketplaceItem) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{item.rating}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {item.price === 0 ? 'Free' : `$${item.price / 100}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => installMutation.mutate(item.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install
                      </Button>
                      {item.price > 0 && (
                        <Button
                          size="sm"
                          onClick={() => purchaseMutation.mutate(item.id)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
