import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, FolderOpen, Palette } from 'lucide-react';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../server/src/schema';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    color: null
  });

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#475569', '#374151'
  ];

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingCategory) {
        const updateData: UpdateCategoryInput = {
          id: editingCategory.id,
          name: formData.name,
          color: formData.color
        };
        const updatedCategory = await trpc.updateCategory.mutate(updateData);
        setCategories((prev: Category[]) => 
          prev.map((c: Category) => c.id === editingCategory.id ? updatedCategory : c)
        );
        setEditingCategory(null);
      } else {
        const newCategory = await trpc.createCategory.mutate(formData);
        setCategories((prev: Category[]) => [...prev, newCategory]);
      }
      
      // Reset form
      setFormData({
        name: '',
        color: null
      });
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteCategory.mutate(id);
      setCategories((prev: Category[]) => prev.filter((c: Category) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      color: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Category Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category Name</label>
              <Input
                placeholder="e.g., Groceries, Entertainment, Gas"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Category Color (Optional)
              </label>
              <div className="grid grid-cols-10 gap-2 mb-4">
                {predefinedColors.map((color: string) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev: CreateCategoryInput) => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.color || '#6B7280'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-16 h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev: CreateCategoryInput) => ({ ...prev, color: null }))}
                >
                  Clear Color
                </Button>
                <span className="text-sm text-gray-500">
                  Selected: {formData.color || 'Default Gray'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || !formData.name.trim()}>
                {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
              {editingCategory && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
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
            <FolderOpen className="h-5 w-5" />
            Your Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No categories yet!</p>
              <p className="text-sm text-gray-400">Create your first category above to organize your transactions 📂</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: Category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{category.name}"? This will also affect any transactions using this category.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(category.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
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

      {/* Quick Category Suggestions */}
      {categories.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">💡 Need Ideas?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">Here are some popular category suggestions:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-blue-800">🏠 Housing</p>
                <div className="text-blue-600 space-y-1">
                  <div>Rent/Mortgage</div>
                  <div>Utilities</div>
                  <div>Maintenance</div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">🍔 Food</p>
                <div className="text-blue-600 space-y-1">
                  <div>Groceries</div>
                  <div>Restaurants</div>
                  <div>Coffee</div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">🚗 Transport</p>
                <div className="text-blue-600 space-y-1">
                  <div>Gas</div>
                  <div>Public Transit</div>
                  <div>Car Payment</div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">🎬 Entertainment</p>
                <div className="text-blue-600 space-y-1">
                  <div>Movies</div>
                  <div>Subscriptions</div>
                  <div>Hobbies</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
