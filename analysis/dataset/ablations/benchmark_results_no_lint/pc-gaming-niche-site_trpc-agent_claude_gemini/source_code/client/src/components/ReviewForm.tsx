import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import type { CreateReviewArticleInput, ProductCategory, PriceRange } from '../../../server/src/schema';

interface ReviewFormProps {
  onSubmit: (data: CreateReviewArticleInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateReviewArticleInput>;
  mode?: 'create' | 'edit';
}

export function ReviewForm({ 
  onSubmit, 
  isLoading = false, 
  initialData,
  mode = 'create' 
}: ReviewFormProps) {
  const [formData, setFormData] = useState<CreateReviewArticleInput>({
    product_name: initialData?.product_name || '',
    brand: initialData?.brand || '',
    category: initialData?.category || 'mice',
    star_rating: initialData?.star_rating || 5,
    price_range: initialData?.price_range || 'under_25',
    pros: initialData?.pros || [''],
    cons: initialData?.cons || [''],
    review_body: initialData?.review_body || '',
    published: initialData?.published || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    
    // Reset form only in create mode
    if (mode === 'create') {
      setFormData({
        product_name: '',
        brand: '',
        category: 'mice',
        star_rating: 5,
        price_range: 'under_25',
        pros: [''],
        cons: [''],
        review_body: '',
        published: false
      });
    }
  };

  const updateProsCons = (type: 'pros' | 'cons', index: number, value: string) => {
    setFormData((prev: CreateReviewArticleInput) => ({
      ...prev,
      [type]: prev[type].map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const addProsConsItem = (type: 'pros' | 'cons') => {
    setFormData((prev: CreateReviewArticleInput) => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeProsConsItem = (type: 'pros' | 'cons', index: number) => {
    setFormData((prev: CreateReviewArticleInput) => ({
      ...prev,
      [type]: prev[type].filter((_, i: number) => i !== index)
    }));
  };

  const isFormValid = 
    formData.product_name.trim() !== '' &&
    formData.brand.trim() !== '' &&
    formData.review_body.length >= 50 &&
    formData.pros.some(pro => pro.trim() !== '') &&
    formData.cons.some(con => con.trim() !== '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '➕ Create New Review' : '✏️ Edit Review'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Add a new review for a budget gaming peripheral' 
            : 'Update the review details'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, product_name: e.target.value }))
                }
                placeholder="e.g. MX Master 3S"
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="e.g. Logitech"
                required
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, category: value as ProductCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mice">🖱️ Mice</SelectItem>
                  <SelectItem value="keyboards">⌨️ Keyboards</SelectItem>
                  <SelectItem value="headsets">🎧 Headsets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Star Rating *</Label>
              <Select
                value={formData.star_rating.toString()}
                onValueChange={(value) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, star_rating: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 Star</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price Range *</Label>
              <Select
                value={formData.price_range}
                onValueChange={(value) =>
                  setFormData((prev: CreateReviewArticleInput) => ({ ...prev, price_range: value as PriceRange }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_25">💰 Under $25</SelectItem>
                  <SelectItem value="25_50">💰 $25 - $50</SelectItem>
                  <SelectItem value="50_100">💰 $50 - $100</SelectItem>
                  <SelectItem value="100_plus">💰 $100+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-green-700 font-medium">✅ Pros *</Label>
              <div className="space-y-2 mt-2">
                {formData.pros.map((pro: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={pro}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProsCons('pros', index, e.target.value)
                      }
                      placeholder={`Pro #${index + 1}`}
                      required={index === 0}
                    />
                    {formData.pros.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProsConsItem('pros', index)}
                        className="px-3"
                      >
                        ❌
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProsConsItem('pros')}
                  className="w-full"
                >
                  ➕ Add Pro
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-red-700 font-medium">❌ Cons *</Label>
              <div className="space-y-2 mt-2">
                {formData.cons.map((con: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={con}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProsCons('cons', index, e.target.value)
                      }
                      placeholder={`Con #${index + 1}`}
                      required={index === 0}
                    />
                    {formData.cons.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProsConsItem('cons', index)}
                        className="px-3"
                      >
                        ❌
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProsConsItem('cons')}
                  className="w-full"
                >
                  ➕ Add Con
                </Button>
              </div>
            </div>
          </div>

          {/* Review Body */}
          <div>
            <Label htmlFor="review_body">Detailed Review *</Label>
            <Textarea
              id="review_body"
              value={formData.review_body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateReviewArticleInput) => ({ ...prev, review_body: e.target.value }))
              }
              placeholder="Write your detailed review here... Include performance, build quality, value for money, and overall experience."
              rows={8}
              required
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${formData.review_body.length >= 50 ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.review_body.length}/50 characters minimum
              </p>
              {formData.review_body.length >= 50 && <span className="text-green-600 text-xs">✅ Minimum reached</span>}
            </div>
          </div>

          {/* Publish Settings */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: CreateReviewArticleInput) => ({ ...prev, published: checked }))
              }
            />
            <Label htmlFor="published" className="cursor-pointer">
              {formData.published ? '✅ Publish immediately' : '📄 Save as draft'}
            </Label>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading || !isFormValid} 
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {mode === 'create' ? 'Creating Review...' : 'Updating Review...'}
              </>
            ) : (
              <>
                {mode === 'create' ? '🚀 Create Review' : '💾 Update Review'}
              </>
            )}
          </Button>
          
          {!isFormValid && (
            <p className="text-xs text-red-600 text-center">
              Please fill in all required fields and ensure the review is at least 50 characters long.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
