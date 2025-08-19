import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CreateArticleInput, ProductCategory } from '../../../server/src/schema';

interface ArticleFormProps {
  initialData?: Partial<CreateArticleInput>;
  onSubmit: (data: CreateArticleInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function ArticleForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEdit = false 
}: ArticleFormProps) {
  const [formData, setFormData] = useState<CreateArticleInput>({
    product_name: initialData.product_name || '',
    category: initialData.category || 'mice',
    price: initialData.price || 0,
    overall_rating: initialData.overall_rating || 5,
    short_description: initialData.short_description || '',
    detailed_review: initialData.detailed_review || '',
    pros: initialData.pros || [''],
    cons: initialData.cons || [''],
    main_image_url: initialData.main_image_url || null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required';
    }

    if (!formData.detailed_review.trim()) {
      newErrors.detailed_review = 'Detailed review is required';
    }

    const validPros = formData.pros.filter((pro: string) => pro.trim() !== '');
    if (validPros.length === 0) {
      newErrors.pros = 'At least one pro is required';
    }

    const validCons = formData.cons.filter((con: string) => con.trim() !== '');
    if (validCons.length === 0) {
      newErrors.cons = 'At least one con is required';
    }

    if (formData.main_image_url && !isValidUrl(formData.main_image_url)) {
      newErrors.main_image_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up the data before submission
    const cleanedData: CreateArticleInput = {
      ...formData,
      pros: formData.pros.filter((pro: string) => pro.trim() !== ''),
      cons: formData.cons.filter((con: string) => con.trim() !== ''),
      main_image_url: formData.main_image_url?.trim() || null
    };

    await onSubmit(cleanedData);
  };

  // Helper functions for managing pros/cons arrays
  const updatePros = (index: number, value: string) => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      pros: prev.pros.map((pro: string, i: number) => i === index ? value : pro)
    }));
    if (errors.pros) {
      setErrors((prev: Record<string, string>) => ({ ...prev, pros: '' }));
    }
  };

  const addPro = () => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      pros: [...prev.pros, '']
    }));
  };

  const removePro = (index: number) => {
    if (formData.pros.length > 1) {
      setFormData((prev: CreateArticleInput) => ({
        ...prev,
        pros: prev.pros.filter((_: string, i: number) => i !== index)
      }));
    }
  };

  const updateCons = (index: number, value: string) => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      cons: prev.cons.map((con: string, i: number) => i === index ? value : con)
    }));
    if (errors.cons) {
      setErrors((prev: Record<string, string>) => ({ ...prev, cons: '' }));
    }
  };

  const addCon = () => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      cons: [...prev.cons, '']
    }));
  };

  const removeCon = (index: number) => {
    if (formData.cons.length > 1) {
      setFormData((prev: CreateArticleInput) => ({
        ...prev,
        cons: prev.cons.filter((_: string, i: number) => i !== index)
      }));
    }
  };

  // Clear specific error when user starts typing
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData((prev: CreateArticleInput) => ({ ...prev, product_name: e.target.value }));
                  clearError('product_name');
                }}
                placeholder="e.g., SteelSeries Rival 3"
                className={errors.product_name ? 'border-red-500' : ''}
              />
              {errors.product_name && (
                <p className="text-sm text-red-600 mt-1">{errors.product_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value: ProductCategory) =>
                setFormData((prev: CreateArticleInput) => ({ ...prev, category: value }))
              }>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData((prev: CreateArticleInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
                  clearError('price');
                }}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <Label htmlFor="rating">Overall Rating (1-5) *</Label>
              <Select value={formData.overall_rating.toString() || '5'} onValueChange={(value: string) =>
                setFormData((prev: CreateArticleInput) => ({ ...prev, overall_rating: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 Star - Poor</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Stars - Fair</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Stars - Good</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Stars - Very Good</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Product Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.main_image_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev: CreateArticleInput) => ({ ...prev, main_image_url: e.target.value || null }));
                clearError('main_image_url');
              }}
              placeholder="https://example.com/product-image.jpg"
              className={errors.main_image_url ? 'border-red-500' : ''}
            />
            {errors.main_image_url && (
              <p className="text-sm text-red-600 mt-1">{errors.main_image_url}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Tip: Use high-quality images from sites like Unsplash or product manufacturer websites
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="short_description">Short Description *</Label>
            <Textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setFormData((prev: CreateArticleInput) => ({ ...prev, short_description: e.target.value }));
                clearError('short_description');
              }}
              placeholder="Brief overview that will appear in the article preview..."
              rows={2}
              className={errors.short_description ? 'border-red-500' : ''}
            />
            {errors.short_description && (
              <p className="text-sm text-red-600 mt-1">{errors.short_description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="detailed_review">Detailed Review *</Label>
            <Textarea
              id="detailed_review"
              value={formData.detailed_review}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setFormData((prev: CreateArticleInput) => ({ ...prev, detailed_review: e.target.value }));
                clearError('detailed_review');
              }}
              placeholder="Write your comprehensive review here. Include details about build quality, performance, design, value for money, and overall experience..."
              rows={8}
              className={errors.detailed_review ? 'border-red-500' : ''}
            />
            {errors.detailed_review && (
              <p className="text-sm text-red-600 mt-1">{errors.detailed_review}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800">✅ Pros *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {formData.pros.map((pro: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={pro}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePros(index, e.target.value)}
                  placeholder="Enter a positive point..."
                  className="flex-1"
                />
                {formData.pros.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removePro(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPro} className="w-full">
              Add Another Pro
            </Button>
            {errors.pros && (
              <Alert>
                <AlertDescription className="text-red-600">{errors.pros}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800">❌ Cons *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {formData.cons.map((con: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={con}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCons(index, e.target.value)}
                  placeholder="Enter a negative point..."
                  className="flex-1"
                />
                {formData.cons.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCon(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addCon} className="w-full">
              Add Another Con
            </Button>
            {errors.cons && (
              <Alert>
                <AlertDescription className="text-red-600">{errors.cons}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEdit ? '💾 Update Article' : '📝 Create Article'}
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
