import { useState } from 'react';
import type { Item, CreateItemInput, UpdateItemInput, Transaction, CreateTransactionInput } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

function App() {
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: "Laptop",
      code: "LAP-001",
      description: "Gaming laptop with high performance specs",
      stock: 15,
      created_at: new Date("2023-01-15"),
      updated_at: new Date("2023-06-20")
    },
    {
      id: 2,
      name: "Monitor",
      code: "MON-002",
      description: "27-inch 4K monitor",
      stock: 8,
      created_at: new Date("2023-02-10"),
      updated_at: new Date("2023-07-15")
    },
    {
      id: 3,
      name: "Keyboard",
      code: "KEY-003",
      description: "Mechanical keyboard with RGB lighting",
      stock: 25,
      created_at: new Date("2023-03-05"),
      updated_at: new Date("2023-08-01")
    }
  ]);
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      item_id: 1,
      type: 'in',
      quantity: 20,
      created_at: new Date("2023-06-15")
    },
    {
      id: 2,
      item_id: 1,
      type: 'out',
      quantity: 5,
      created_at: new Date("2023-06-18")
    },
    {
      id: 3,
      item_id: 2,
      type: 'in',
      quantity: 10,
      created_at: new Date("2023-07-10")
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newItem, setNewItem] = useState<Omit<CreateItemInput, 'id'>>({ 
    name: '', 
    code: '', 
    description: null, 
    stock: 0 
  });
  
  const [editItem, setEditItem] = useState<UpdateItemInput | null>(null);
  const [transaction, setTransaction] = useState<CreateTransactionInput>({ 
    item_id: 0, 
    type: 'in', 
    quantity: 1 
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Generate next ID
  const getNextId = (items: {id: number}[]) => {
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  };

  // Item CRUD operations (stubbed since backend is not properly implemented)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new item with ID
      const createdItem: Item = {
        id: getNextId(items),
        name: newItem.name,
        code: newItem.code,
        description: newItem.description,
        stock: newItem.stock,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setItems([...items, createdItem]);
      setNewItem({ name: '', code: '', description: null, stock: 0 });
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to create item: ' + (err as Error).message);
      console.error('Error creating item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update item in state
      const updatedItem: Item = {
        id: editItem.id,
        name: editItem.name || '',
        code: editItem.code || '',
        description: editItem.description || null,
        stock: editItem.stock || 0,
        created_at: new Date(), // In a real app, this would be from the existing item
        updated_at: new Date()
      };
      
      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
      setEditItem(null);
      setIsEditDialogOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to update item: ' + (err as Error).message);
      console.error('Error updating item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if item has transactions
      const hasTransactions = transactions.some(t => t.item_id === id);
      if (hasTransactions) {
        setError('Cannot delete item with existing transactions');
        return;
      }
      
      setItems(items.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete item: ' + (err as Error).message);
      console.error('Error deleting item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Transaction operations (stubbed since backend is not properly implemented)
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Validate item exists
      const itemExists = items.some(item => item.id === transaction.item_id);
      if (!itemExists) {
        setError('Selected item does not exist');
        return;
      }
      
      // Create new transaction
      const newTransaction: Transaction = {
        id: getNextId(transactions),
        item_id: transaction.item_id,
        type: transaction.type,
        quantity: transaction.quantity,
        created_at: new Date()
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      // Update item stock
      const updatedItems = items.map(item => {
        if (item.id === transaction.item_id) {
          const newStock = transaction.type === 'in' 
            ? item.stock + transaction.quantity 
            : item.stock - transaction.quantity;
          return { ...item, stock: Math.max(0, newStock) }; // Ensure stock doesn't go negative
        }
        return item;
      });
      setItems(updatedItems);
      
      setTransaction({ item_id: 0, type: 'in', quantity: 1 });
      setIsTransactionDialogOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to create transaction: ' + (err as Error).message);
      console.error('Error creating transaction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management System</h1>
        <p className="text-gray-600 mt-2">Manage your items and track inventory transactions</p>
        <Alert className="mt-4">
          <AlertDescription>
            Note: Backend integration is currently stubbed. Data is stored in-memory and will reset on page refresh.
          </AlertDescription>
        </Alert>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Item Code</Label>
                <Input
                  id="code"
                  value={newItem.code}
                  onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                  placeholder="Enter item code"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value || null})}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div>
                <Label htmlFor="stock">Initial Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">Record Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <Label htmlFor="item">Item</Label>
                <Select 
                  value={transaction.item_id ? transaction.item_id.toString() : ''} 
                  onValueChange={(value) => setTransaction({...transaction, item_id: parseInt(value)})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select 
                  value={transaction.type} 
                  onValueChange={(value: 'in' | 'out') => setTransaction({...transaction, type: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">IN (Incoming)</SelectItem>
                    <SelectItem value="out">OUT (Outgoing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={transaction.quantity}
                  onChange={(e) => setTransaction({...transaction, quantity: parseInt(e.target.value) || 1})}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Recording...' : 'Record Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items found. Add your first item to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.stock === 0 ? "destructive" : "default"}>
                          {item.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setEditItem(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditItem({
                                  id: item.id,
                                  name: item.name,
                                  code: item.code,
                                  description: item.description,
                                  stock: item.stock
                                })}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Item</DialogTitle>
                              </DialogHeader>
                              {editItem && (
                                <form onSubmit={handleUpdateItem} className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-name">Item Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={editItem.name || ''}
                                      onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                                      placeholder="Enter item name"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-code">Item Code</Label>
                                    <Input
                                      id="edit-code"
                                      value={editItem.code || ''}
                                      onChange={(e) => setEditItem({...editItem, code: e.target.value})}
                                      placeholder="Enter item code"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Input
                                      id="edit-description"
                                      value={editItem.description || ''}
                                      onChange={(e) => setEditItem({...editItem, description: e.target.value || null})}
                                      placeholder="Enter description (optional)"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-stock">Stock</Label>
                                    <Input
                                      id="edit-stock"
                                      type="number"
                                      min="0"
                                      value={editItem.stock || 0}
                                      onChange={(e) => setEditItem({...editItem, stock: parseInt(e.target.value) || 0})}
                                    />
                                  </div>
                                  <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Updating...' : 'Update Item'}
                                  </Button>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => {
                    const item = items.find(i => i.id === transaction.item_id);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.created_at.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {item ? `${item.name} (${item.code})` : 'Unknown Item'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                            {transaction.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.quantity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
