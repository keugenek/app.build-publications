import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Mouse, Keyboard, Headphones, Square, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import type { CreateProductReviewInput, ProductCategory, ProductReview } from '../../../server/src/schema';

const categoryIcons = {
  mice: Mouse,
  keyboards: Keyboard,
  headsets: Headphones,
  mousepads: Square,
  controllers: Gamepad2
};

interface ReviewFormProps {
  categories: ProductCategory[];
  initialData?: ProductReview | null;
  onSubmit: (data: CreateProductReviewInput) => Promise<void>;
  isLoading: boolean;
}

export function ReviewForm({ categories, initialData, onSubmit, isLoading }: ReviewFormProps) {
  const [formData, setFormData] = useState<CreateProductReviewInput>(() => {
    if (initialData) {
      return {
        product_name: initialData.product_name,
        brand: initialData.brand,
        category: initialData.category,
        rating: initialData.rating,
        pros: initialData.pros.length > 0 ? initialData.pros : [''],
        cons: initialData.cons.length > 0 ? initialData.cons : [''],
        review_text: initialData.review_text,
        image_urls: initialData.image_urls.length > 0 ? initialData.image_urls : [''],
        is_published: initialData.is_published
      };
    }
    
    return {
      product_name: '',
      brand: '',
      category: 'mice',
      rating: 5,
      pros: [''],
      cons: [''],
      review_text: '',
      image_urls: [''],
      is_published: false
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up arrays by filtering out empty strings
    const cleanData = {
      ...formData,
      pros: formData.pros.filter(p => p.trim() !== ''),
      cons: formData.cons.filter(c => c.trim() !== ''),
      image_urls: formData.image_urls.filter(url => url.trim() !== '')
    };

    await onSubmit(cleanData);
  };

  const addArrayItem = (field: 'pros' | 'cons' | 'image_urls') => {
    setFormData((prev: CreateProductReviewInput) => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'pros' | 'cons' | 'image_urls', index: number, value: string) => {
    setFormData((prev: CreateProductReviewInput) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: 'pros' | 'cons' | 'image_urls', index: number) => {
    setFormData((prev: CreateProductReviewInput) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_name">Product Name</Label>
          <Input
            id="product_name"
            value={formData.product_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProductReviewInput) => ({ ...prev, product_name: e.target.value }))
            }
            placeholder="e.g., Logitech G305"
            required
          />
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProductReviewInput) => ({ ...prev, brand: e.target.value }))
            }
            placeholder="e.g., Logitech"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: ProductCategory) =>
              setFormData((prev: CreateProductReviewInput) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: ProductCategory) => {
                const Icon = categoryIcons[category];
                return (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rating">Rating (1-10)</Label>
          <Input
            id="rating"
            type="number"
            min="1"
            max="10"
            value={formData.rating}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProductReviewInput) => ({ ...prev, rating: parseInt(e.target.value) || 1 }))
            }
            required
          />
        </div>
      </div>

      <div>
        <Label>Pros 👍</Label>
        <div className="space-y-2 mt-2">
          {formData.pros.map((pro: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={pro}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateArrayItem('pros', index, e.target.value)
                }
                placeholder="Enter a positive point"
                className="flex-1"
              />
              {formData.pros.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('pros', index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('pros')}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Pro
          </Button>
        </div>
      </div>

      <div>
        <Label>Cons 👎</Label>
        <div className="space-y-2 mt-2">
          {formData.cons.map((con: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={con}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateArrayItem('cons', index, e.target.value)
                }
                placeholder="Enter a negative point"
                className="flex-1"
              />
              {formData.cons.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('cons', index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('cons')}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Con
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="review_text">Review Text</Label>
        <Textarea
          id="review_text"
          value={formData.review_text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateProductReviewInput) => ({ ...prev, review_text: e.target.value }))
          }
          placeholder="Write your detailed review here... Share your experience with this gaming peripheral!"
          rows={8}
          className="resize-none"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.review_text.length} characters (minimum 10 required)
        </p>
      </div>

      <div>
        <Label>Image URLs 📸</Label>
        <div className="space-y-2 mt-2">
          {formData.image_urls.map((url: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateArrayItem('image_urls', index, e.target.value)
                }
                placeholder="https://example.com/image.jpg"
                type="url"
                className="flex-1"
              />
              {formData.image_urls.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('image_urls', index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('image_urls')}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Image
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked: boolean) =>
            setFormData((prev: CreateProductReviewInput) => ({ ...prev, is_published: checked }))
          }
        />
        <Label htmlFor="is_published" className="font-medium">
          {formData.is_published ? '🟢 Publish immediately' : '🟡 Save as draft'}
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading || formData.review_text.length < 10}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update Review' : 'Create Review')}
        </Button>
      </div>
    </form>
  );
}
