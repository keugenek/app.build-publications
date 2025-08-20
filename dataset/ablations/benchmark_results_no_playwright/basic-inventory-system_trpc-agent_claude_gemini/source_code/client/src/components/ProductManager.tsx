import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

interface ProductManagerProps {
  products: Product[];
  isLoading: boolean;
  onProductCreated: (product: Product) => void;
  onProductUpdated: (product: Product) => void;
  onProductDeleted: (productId: number) => void;
  onProductSelected: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductManager({
  products,
  isLoading,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  onProductSelected,
  onRefresh
}: ProductManagerProps) {
  // Form states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form data
  const [createFormData, setCreateFormData] = useState<CreateProductInput>({
    name: '',
    sku: '',
    description: null,
    initial_stock: 0
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState<UpdateProductInput>({
    id: 0,
    name: '',
    sku: '',
    description: null
  });

  // Handle create form submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await trpc.createProduct.mutate(createFormData);
      onProductCreated(result);
      setCreateFormData({
        name: '',
        sku: '',
        description: null,
        initial_stock: 0
      });
      setCreateFormOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSubmitting(true);
    try {
      const result = await trpc.updateProduct.mutate(editFormData);
      onProductUpdated(result);
      setEditingProduct(null);
      setEditFormData({
        id: 0,
        name: '',
        sku: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (productId: number) => {
    try {
      await trpc.deleteProduct.mutate({ id: productId });
      onProductDeleted(productId);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description
    });
  };

  // Get stock level badge variant
  const getStockBadgeVariant = (stockLevel: number) => {
    if (stockLevel === 0) return 'destructive';
    if (stockLevel < 10) return 'outline';
    return 'secondary';
  };

  // Get stock level color
  const getStockLevelColor = (stockLevel: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (stockLevel < 10) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">Manage your inventory products</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
            🔄 Refresh
          </Button>
          <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
            <DialogTrigger asChild>
              <Button>➕ Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Product Name</Label>
                  <Input
                    id="create-name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-sku">SKU (Stock Keeping Unit)</Label>
                  <Input
                    id="create-sku"
                    value={createFormData.sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="Enter unique SKU"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-description">Description (Optional)</Label>
                  <Textarea
                    id="create-description"
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-stock">Initial Stock Quantity</Label>
                  <Input
                    id="create-stock"
                    type="number"
                    value={createFormData.initial_stock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({
                        ...prev,
                        initial_stock: parseInt(e.target.value) || 0
                      }))
                    }
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateFormOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">Create your first product to get started</p>
              <Button onClick={() => setCreateFormOpen(true)}>
                Add Your First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        SKU: {product.sku}
                      </Badge>
                      <Badge 
                        variant={getStockBadgeVariant(product.stock_level)}
                        className="text-xs"
                      >
                        Stock: {product.stock_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onProductSelected(product)}
                    >
                      📋 Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(product)}
                    >
                      ✏️ Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          🗑️ Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone and will also remove all associated stock transactions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Product
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-muted-foreground text-sm mb-3">{product.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Created: {product.created_at.toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">
                      Updated: {product.updated_at.toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`font-semibold ${getStockLevelColor(product.stock_level)}`}>
                    {product.stock_level === 0 ? 'Out of Stock' : 
                     product.stock_level < 10 ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU (Stock Keeping Unit)</Label>
              <Input
                id="edit-sku"
                value={editFormData.sku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Enter unique SKU"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingProduct(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
