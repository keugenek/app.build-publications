import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: () => void;
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingCategory) {
        // Update existing category
        await trpc.updateCategory.mutate({
          id: editingCategory.id,
          name: formData.name,
          description: formData.description
        });
        setEditingCategory(null);
      } else {
        // Create new category
        await trpc.createCategory.mutate(formData);
      }

      // Reset form
      setFormData({
        name: '',
        description: null
      });

      onCategoriesChange();
      alert(editingCategory ? 'Category updated successfully! ✅' : 'Category created successfully! 🎉');
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: null
    });
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await trpc.deleteCategory.mutate({ id: categoryId });
      onCategoriesChange();
      alert('Category deleted successfully! 🗑️');
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. It may still have associated articles.');
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'mice':
        return '🖱️';
      case 'keyboards':
        return '⌨️';
      case 'headsets':
        return '🎧';
      case 'monitors':
        return '🖥️';
      case 'mousepads':
        return '🎯';
      default:
        return '🎮';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Category Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingCategory ? '✏️ Edit Category' : '➕ Create New Category'}
          </CardTitle>
          <CardDescription>
            {editingCategory 
              ? 'Update the category information' 
              : 'Add a new product category for organizing reviews'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Gaming Mice"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (editingCategory ? '⏳ Updating...' : '⏳ Creating...') 
                  : (editingCategory ? '💾 Update Category' : '🚀 Create Category')}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  ❌ Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📁 Existing Categories
          </CardTitle>
          <CardDescription>
            Manage your product categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">📭 No categories yet!</p>
              <p>Create your first category above to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getCategoryIcon(category.name)}</span>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Created: {category.created_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      disabled={editingCategory?.id === category.id}
                    >
                      ✏️ Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          🗑️ Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to delete this category?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the 
                            "{category.name}" category. Articles in this category will need 
                            to be reassigned to another category.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Category
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
