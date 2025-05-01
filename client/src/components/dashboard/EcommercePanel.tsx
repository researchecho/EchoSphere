import React, { useState } from 'react';
import {
  LucideSearch,
  LucideShoppingBag,
  LucideTag,
  LucideDollarSign,
  LucidePackage,
  LucideUsers,
  LucidePlus,
  LucideEdit,
  LucideTrash,
  LucideMoreHorizontal,
  LucideEye,
  LucideRefreshCw,
  LucideLoader,
  LucideAlertCircle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

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
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { EcommerceStore, Product } from '@shared/schema';

// Order type
type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'completed' | 'processing' | 'cancelled';
  date: string;
  products: number[];
};

// Extended product type with extra UI-specific properties
interface ProductWithStatus extends Product {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  sales: number;
  category: string;
}

export default function EcommercePanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStatus | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    inventory: 0,
    imageUrl: '',
    storeId: 0,
  });
  
  // API Queries with explicit types
  const storesQuery = useQuery<{ stores: EcommerceStore[] }>({
    queryKey: ['/api/stores'],
    retry: 1,
    meta: {
      errorMessage: 'Failed to load stores'
    }
  });

  const productsQuery = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products'],
    retry: 1,
    meta: {
      errorMessage: 'Failed to load products'
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete product: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: typeof newProduct) => {
      return apiRequest('POST', '/api/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      setIsAddProductDialogOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        inventory: 0,
        imageUrl: '',
        storeId: 0,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create product: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Loading state
  const isLoading = productsQuery.isLoading || storesQuery.isLoading;
  
  // Error state 
  const isError = productsQuery.isError || storesQuery.isError;
  
  // Prepare store and product data using actual ApiResponse structure
  const storesData = storesQuery.data as { stores: EcommerceStore[] } | undefined;
  const productsData = productsQuery.data as { products: Product[] } | undefined;
  
  const stores: EcommerceStore[] = storesData?.stores || [];
  const products: ProductWithStatus[] = (productsData?.products || []).map((product: Product) => {
    let status: 'in_stock' | 'low_stock' | 'out_of_stock';
    const inventory = product.inventory || 0;
    
    if (inventory <= 0) {
      status = 'out_of_stock';
    } else if (inventory < 10) {
      status = 'low_stock';
    } else {
      status = 'in_stock';
    }
    
    return {
      ...product,
      status,
      sales: 0, // This would come from an orders table in a real app
      category: product.description || 'General', // Using description as category for now
      // Ensure all the required fields from our schema are included
      id: product.id,
      name: product.name,
      storeId: product.storeId,
      description: product.description || '',
      price: product.price,
      inventory: inventory,
      imageUrl: product.imageUrl || '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  });
  
  // Mock orders data 
  const orders: Order[] = [
    {
      id: 1001,
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      amount: 149.98,
      status: 'completed',
      date: '2023-04-28T14:30:00Z',
      products: [1, 3],
    },
    {
      id: 1002,
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      amount: 49.99,
      status: 'processing',
      date: '2023-04-29T10:45:00Z',
      products: [2],
    },
    {
      id: 1003,
      customerName: 'Robert Johnson',
      customerEmail: 'robert.j@example.com',
      amount: 69.98,
      status: 'completed',
      date: '2023-04-27T16:20:00Z',
      products: [3, 4],
    }
  ];

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.status.toLowerCase().includes(query)
    );
  });

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.id.toString().includes(query)
    );
  });

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle product deletion
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };
  
  // Handle new product form submission
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(newProduct);
  };
  
  // Handle new product form changes
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'inventory' || name === 'storeId') {
      setNewProduct({
        ...newProduct,
        [name]: Number(value),
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: value,
      });
    }
  };

  // Get status badge variant
  const getProductStatusBadgeVariant = (status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    switch (status) {
      case 'in_stock':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get order status badge variant
  const getOrderStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Calculate stats
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalCustomers = new Set(orders.map(order => order.customerEmail)).size;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">E-commerce</h2>
          <p className="text-muted-foreground">Manage your products and orders.</p>
        </div>
        <Button onClick={() => setIsAddProductDialogOpen(true)}>
          <LucidePlus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <LucideDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <LucidePackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {products.filter(p => p.status !== 'out_of_stock').length} available items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <LucideShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {orders.filter(o => o.status === 'processing').length} processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <LucideUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique buyers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="products" className="mt-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={getProductStatusBadgeVariant(product.status)}>
                        {product.status === 'in_stock'
                          ? 'In Stock'
                          : product.status === 'low_stock'
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.sales}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <LucideMoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <LucideEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <LucideEye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <LucideTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products found. Try a different search term or add a new product.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>{formatPrice(order.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <LucideMoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <LucideEye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <LucideRefreshCw className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found. Try a different search term.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete product confirmation dialog */}
      {selectedProduct && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete "{selectedProduct.name}" from your products.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDeleteProduct}>
                Delete Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to sell in your store.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input 
                  id="name"
                  name="name"
                  className="col-span-3" 
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={handleNewProductChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Description
                </label>
                <Input 
                  id="description"
                  name="description"
                  className="col-span-3" 
                  placeholder="Product description"
                  value={newProduct.description}
                  onChange={handleNewProductChange}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right">
                  Price
                </label>
                <div className="col-span-3 flex items-center border rounded-md">
                  <span className="pl-3 text-muted-foreground">$</span>
                  <Input 
                    id="price"
                    name="price" 
                    className="border-0" 
                    placeholder="0.00" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={handleNewProductChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="storeId" className="text-right">
                  Store
                </label>
                <select 
                  id="storeId"
                  name="storeId"
                  className="col-span-3 p-2 border rounded-md"
                  value={newProduct.storeId}
                  onChange={handleNewProductChange}
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="inventory" className="text-right">
                  Inventory
                </label>
                <Input 
                  id="inventory"
                  name="inventory"
                  className="col-span-3" 
                  placeholder="Quantity" 
                  type="number"
                  min="0"
                  value={newProduct.inventory}
                  onChange={handleNewProductChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="imageUrl" className="text-right">
                  Image URL
                </label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  className="col-span-3" 
                  placeholder="https://example.com/image.jpg"
                  value={newProduct.imageUrl}
                  onChange={handleNewProductChange}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={createProductMutation.isPending}
              >
                {createProductMutation.isPending ? (
                  <>
                    <LucideLoader className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}