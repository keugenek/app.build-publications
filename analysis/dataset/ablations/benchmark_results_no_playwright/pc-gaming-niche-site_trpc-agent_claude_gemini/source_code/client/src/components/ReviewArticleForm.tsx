import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Category, CreateReviewArticleInput } from '../../../server/src/schema';

interface ReviewArticleFormProps {
  categories: Category[];
  onSuccess: () => void;
}

export function ReviewArticleForm({ categories, onSuccess }: ReviewArticleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateReviewArticleInput>({
    title: '',
    category_id: 0,
    brand: '',
    model: '',
    star_rating: 0,
    pros: '',
    cons: '',
    main_image_url: null,
    review_content: '',
    published_at: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.category_id === 0) {
      alert('Please select a category');
      return;
    }
    if (formData.star_rating === 0) {
      alert('Please select a star rating');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.createReviewArticle.mutate(formData);
      // Reset form
      setFormData({
        title: '',
        category_id: 0,
        brand: '',
        model: '',
        star_rating: 0,
        pros: '',
        cons: '',
        main_image_url: null,
        review_content: '',
        published_at: new Date()
      });
      onSuccess();
      alert('Review article created successfully! 🎉');
    } catch (error) {
      console.error('Failed to create review article:', error);
      alert('Failed to create article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStarSelector = () => {
    return (
      <div className="space-y-2">
        <Label htmlFor="star_rating">Star Rating</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData((prev: CreateReviewArticleInput) => ({ ...prev, star_rating: star }))}
              className={`text-2xl hover:scale-110 transition-transform ${
                star <= formData.star_rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
              }`}
            >
              ⭐
            </button>
          ))}
          {formData.star_rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              ({formData.star_rating}/5)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Logitech G203 LIGHTSYNC Review"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id.toString()}
                onValueChange={(value) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, category_id: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name === 'Mice' && '🖱️ '}
                      {category.name === 'Keyboards' && '⌨️ '}
                      {category.name === 'Headsets' && '🎧 '}
                      {!['Mice', 'Keyboards', 'Headsets'].includes(category.name) && '🎮 '}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                placeholder="e.g., Logitech"
                value={formData.brand}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, brand: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="e.g., G203 LIGHTSYNC"
                value={formData.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, model: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStarSelector()}

            <div className="space-y-2">
              <Label htmlFor="main_image_url">Product Image URL</Label>
              <Input
                id="main_image_url"
                placeholder="https://example.com/product-image.jpg"
                type="url"
                value={formData.main_image_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({
                    ...prev,
                    main_image_url: e.target.value || null
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pros and Cons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚖️ Pros and Cons</CardTitle>
          <CardDescription>
            List the positive and negative aspects of this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pros">Pros *</Label>
              <Textarea
                id="pros"
                placeholder="• Great build quality&#10;• Responsive clicks&#10;• Affordable price&#10;• RGB lighting"
                value={formData.pros}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, pros: e.target.value }))
                }
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cons">Cons *</Label>
              <Textarea
                id="cons"
                placeholder="• No wireless option&#10;• Software can be buggy&#10;• Limited customization"
                value={formData.cons}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, cons: e.target.value }))
                }
                rows={6}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📝 Detailed Review</CardTitle>
          <CardDescription>
            Write your comprehensive review of the product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="review_content">Review Content *</Label>
            <Textarea
              id="review_content"
              placeholder="Write your detailed review here... Include information about build quality, performance, value for money, and your overall experience with the product."
              value={formData.review_content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateReviewArticleInput) => ({ ...prev, review_content: e.target.value }))
              }
              rows={12}
              className="min-h-[300px]"
              required
            />
            <p className="text-sm text-gray-500">
              💡 Tip: Include details about performance, build quality, value for money, and comparisons with similar products.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="min-w-[150px]">
          {isLoading ? '⏳ Creating...' : '🚀 Publish Review'}
        </Button>
      </div>
    </form>
  );
}
