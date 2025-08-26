import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
}

export function CategoryManager({ categories, onCategoryCreated }: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const newCategory = await trpc.createCategory.mutate(formData);
      onCategoryCreated(newCategory);
      setFormData({ name: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate predefined and custom categories
  const predefinedCategories = categories.filter((c: Category) => c.is_predefined);
  const customCategories = categories.filter((c: Category) => !c.is_predefined);

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">🏷️ Category Management</span>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>➕ Create Custom Category</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      placeholder="Enter category name..."
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCategoryInput) => ({ 
                          ...prev, 
                          name: e.target.value 
                        }))
                      }
                      required
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500">
                      Create a custom category for organizing your transactions
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading || !formData.name.trim()} className="flex-1">
                      {isLoading ? 'Creating...' : 'Create Category'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setFormData({ name: '' });
                        setIsCreating(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage predefined and custom categories for organizing your transactions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Predefined Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏷️ Predefined Categories
          </CardTitle>
          <CardDescription>
            Built-in categories that are available by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predefinedCategories.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No predefined categories found</p>
              <p className="text-sm text-gray-400 mt-1">
                Predefined categories should be automatically created when you first load the app
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {predefinedCategories.map((category: Category) => (
                <Card key={category.id} className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryEmoji(category.name)}</span>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-xs text-gray-500">
                            Created {category.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Predefined
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Custom Categories
          </CardTitle>
          <CardDescription>
            Categories you've created for your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">📝 No custom categories yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Create custom categories above to organize your transactions in your own way
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {customCategories.map((category: Category) => (
                <Card key={category.id} className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-xs text-gray-500">
                            Created {category.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Custom
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Statistics */}
      {categories.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Category Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Predefined</p>
                <p className="text-2xl font-bold text-blue-600">{predefinedCategories.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Custom</p>
                <p className="text-2xl font-bold text-green-600">{customCategories.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getCategoryEmoji(categoryName: string): string {
  const emojiMap: { [key: string]: string } = {
    'Food': '🍽️',
    'Transport': '🚗',
    'Housing': '🏠',
    'Entertainment': '🎬',
    'Utilities': '⚡',
    'Health': '🏥',
    'Shopping': '🛍️',
    'Education': '📚',
    'Travel': '✈️',
    'Insurance': '🛡️'
  };
  
  return emojiMap[categoryName] || '🏷️';
}
