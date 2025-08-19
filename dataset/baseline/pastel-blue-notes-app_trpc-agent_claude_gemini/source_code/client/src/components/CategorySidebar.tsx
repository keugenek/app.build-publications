import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

interface CategorySidebarProps {
  userId: number;
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  onLogout: () => void;
  userEmail: string;
}

export function CategorySidebar({ 
  userId, 
  selectedCategoryId, 
  onCategorySelect, 
  onLogout,
  userEmail 
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#dbeafe'); // Default blue-100
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query({ userId });
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsLoading(true);
    try {
      const categoryInput: CreateCategoryInput = {
        name: newCategoryName,
        color: newCategoryColor,
        user_id: userId
      };
      
      const newCategory = await trpc.createCategory.mutate(categoryInput);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setNewCategoryName('');
      setNewCategoryColor('#dbeafe');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pastelColors = [
    '#dbeafe', '#fce7f3', '#e0f2fe', '#dcfce7', 
    '#fef3c7', '#f3e8ff', '#fed7d7', '#e6fffa'
  ];

  return (
    <div 
      className="w-64 flex flex-col h-screen border-r border-blue-200"
      style={{ background: 'linear-gradient(180deg, rgb(239 246 255) 0%, rgb(219 234 254) 100%)' }}
    >
      <div className="p-6">
        <h1 className="text-xl font-light text-blue-800 mb-2">📝 Notes</h1>
        <p className="text-xs text-blue-600 truncate">{userEmail}</p>
      </div>
      
      <Separator className="bg-blue-200" />
      
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-blue-700">Categories</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-6 w-6 p-0 bg-blue-200 hover:bg-blue-300 text-blue-700">
                +
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-blue-200">
              <DialogHeader>
                <DialogTitle className="text-blue-800">Create New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                    style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                    required
                  />
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-2">Choose a color:</p>
                  <div className="flex flex-wrap gap-2">
                    {pastelColors.map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          newCategoryColor === color ? 'border-blue-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium border border-blue-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium" 
                    style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategoryId === null 
                ? 'bg-blue-200 text-blue-800' 
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            📄 All Notes
          </button>
          
          {categories.map((category: Category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategoryId === category.id 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color || '#dbeafe' }}
                />
                <span className="truncate">{category.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <Separator className="bg-blue-200" />
      
      <div className="p-4">
        <Button 
          onClick={onLogout}
          variant="outline" 
          className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium border border-blue-200 text-xs"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
