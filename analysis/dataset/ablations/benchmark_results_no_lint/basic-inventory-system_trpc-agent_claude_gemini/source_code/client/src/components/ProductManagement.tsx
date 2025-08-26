import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

interface ProductManagementProps {
  products: Product[];
  onProductCreated: (product: Product) => void;
  onProductUpdated: (product: Product) => void;
  onProductDeleted: (productId: number) => void;
}

export function ProductManagement({ 
  products, 
  onProductCreated, 
  onProductUpdated, 
  onProductDeleted 
}: ProductManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateProductInput>({
    name: '',
    sku: '',
    stock_level: 0
  });

  const [updateFormData, setUpdateFormData] = useState<Partial<UpdateProductInput>>({
    name: '',
    sku: '',
    stock_level: 0
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newProduct = await trpc.createProduct.mutate(createFormData);
      onProductCreated(newProduct);
      setCreateFormData({ name: '', sku: '', stock_level: 0 });
      setCreateFormOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsUpdating(true);
    try {
      const updatedProduct = await trpc.updateProduct.mutate({
        id: editingProduct.id,
        ...updateFormData
      });
      if (updatedProduct) {
        onProductUpdated(updatedProduct);
        setEditingProduct(null);
        setEditFormOpen(false);
      } else {
        console.error('Product not found or could not be updated');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (productId: number) => {
    setIsDeleting(true);
    try {
      await trpc.deleteProduct.mutate({ id: productId });
      onProductDeleted(productId);
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setUpdateFormData({
      name: product.name,
      sku: product.sku,
      stock_level: product.stock_level
    });
    setEditFormOpen(true);
  };

  const getStockStatusBadge = (stockLevel: number) => {
    if (stockLevel === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stockLevel < 10) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Low Stock</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Product Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-gray-600">Manage your inventory products and stock levels</p>
        </div>
        
        <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <span className="mr-2">➕</span>
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your inventory system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={createFormData.sku}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateProductInput) => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder="Enter SKU (e.g., SKU-001)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_level">Initial Stock Level</Label>
                <Input
                  id="stock_level"
                  type="number"
                  value={createFormData.stock_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateProductInput) => ({ 
                      ...prev, 
                      stock_level: parseInt(e.target.value) || 0 
                    }))
                  }
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Products Table */}
      {products.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Create your first product to start managing your inventory.
              You can add product names, SKUs, and initial stock levels.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
            <CardDescription>
              All products in your inventory system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{product.stock_level}</span> units
                    </TableCell>
                    <TableCell>
                      {getStockStatusBadge(product.stock_level)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {product.created_at.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? 
                                This action cannot be undone and will also remove all associated transactions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete Product'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and stock levels.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={updateFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateFormData((prev: Partial<UpdateProductInput>) => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={updateFormData.sku || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateFormData((prev: Partial<UpdateProductInput>) => ({ 
                      ...prev, 
                      sku: e.target.value 
                    }))
                  }
                  placeholder="Enter SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock-level">Stock Level</Label>
                <Input
                  id="edit-stock-level"
                  type="number"
                  value={updateFormData.stock_level || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateFormData((prev: Partial<UpdateProductInput>) => ({ 
                      ...prev, 
                      stock_level: parseInt(e.target.value) || 0 
                    }))
                  }
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
