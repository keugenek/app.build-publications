import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  categories: Category[];
  onCategoryCreate: (category: Category) => void;
  onCategoryUpdate: (category: Category) => void;
  onCategoryDelete: (categoryId: number) => void;
}

// Predefined color options for categories
const colorOptions = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan  
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Violet
];

export function CategoryManager({
  categories,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete
}: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    color: colorOptions[0] as string
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      color: colorOptions[0] as string
    });
    setIsCreating(false);
    setEditingCategory(null);
  };

  // Handle create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCategory.mutate(formData);
      onCategoryCreate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingCategory.id,
        name: formData.name,
        color: formData.color
      };
      const response = await trpc.updateCategory.mutate(updateData);
      onCategoryUpdate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCategory.mutate({ id: categoryId });
      onCategoryDelete(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: (category.color ?? colorOptions[0]) as string
    });
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                🏷️ Category Management
              </CardTitle>
              <CardDescription>
                Create and manage custom categories for organizing your transactions
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isCreating}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Category Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Category Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))
                  }
                  placeholder="Enter category name..."
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setFormData((prev: CreateCategoryInput) => ({ 
                          ...prev, 
                          color 
                        }))
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected color: <span style={{ color: formData.color || '#8B5CF6' }}>●</span> {formData.color}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🏷️</div>
              <p className="text-lg mb-2">No categories yet</p>
              <p className="text-sm mb-6">Create your first category to start organizing your transactions!</p>
              <p className="text-xs text-gray-400">
                <em>Note: Backend is currently using stub data - category creation will work once the database is connected.</em>
              </p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                disabled={isCreating}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color ?? '#8B5CF6' }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">
                          Created {category.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(category)}
                        disabled={isLoading}
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isLoading}>
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the category "{category.name}"? 
                              This will also remove all transactions in this category. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Color: <span style={{ color: category.color ?? '#8B5CF6' }}>●</span> {category.color ?? '#8B5CF6'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      {categories.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">💡 Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <p className="mb-3">Here are some popular category ideas to get you started:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>🍕 Food & Dining</div>
              <div>🚗 Transportation</div>
              <div>🏠 Housing</div>
              <div>⚡ Utilities</div>
              <div>🛍️ Shopping</div>
              <div>🎬 Entertainment</div>
              <div>💊 Healthcare</div>
              <div>📚 Education</div>
              <div>💰 Salary</div>
              <div>🎁 Gifts</div>
              <div>✈️ Travel</div>
              <div>💡 Other</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
