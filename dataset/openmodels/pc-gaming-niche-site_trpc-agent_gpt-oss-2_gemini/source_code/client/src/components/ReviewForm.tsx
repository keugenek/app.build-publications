import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { CreateReviewInput, ReviewArticle, Category } from '../../../server/src/schema';

interface ReviewFormProps {
  /** If editing, provide the existing article */
  initialData?: ReviewArticle;
  /** Callback after successful creation or update */
  onSuccess: (article: ReviewArticle) => void;
}

export function ReviewForm({ initialData, onSuccess }: ReviewFormProps) {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<CreateReviewInput>(
    initialData
      ? {
          product_name: initialData.product_name,
          category: initialData.category,
          brand: initialData.brand,
          overall_rating: initialData.overall_rating,
          pros: initialData.pros,
          cons: initialData.cons,
          detailed_review: initialData.detailed_review,
          featured_image: initialData.featured_image,
        }
      : {
          product_name: '',
          category: 'Mice',
          brand: '',
          overall_rating: 1,
          pros: [],
          cons: [],
          detailed_review: '',
          featured_image: '',
        }
  );

  // Temporary fields for adding a single pro / con
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPro = () => {
    if (newPro.trim()) {
      setFormData((prev) => ({ ...prev, pros: [...prev.pros, newPro.trim()] }));
      setNewPro('');
    }
  };

  const handleAddCon = () => {
    if (newCon.trim()) {
      setFormData((prev) => ({ ...prev, cons: [...prev.cons, newCon.trim()] }));
      setNewCon('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // For now we only have a create endpoint. Edit will be a stub that returns the same data.
      const created = await trpc.createReview.mutate(formData);
      // Merge id and created_at if editing
      const article: ReviewArticle = {
        ...created,
        id: initialData?.id ?? created.id,
        created_at: initialData?.created_at ?? created.created_at,
      } as ReviewArticle;
      onSuccess(article);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingOptions = [1, 2, 3, 4, 5];
  const categories: Category[] = ['Mice', 'Keyboards', 'Headsets', 'Gamepads'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Product name"
        value={formData.product_name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, product_name: e.target.value }))
        }
        required
      />
      <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v as Category }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Brand"
        value={formData.brand}
        onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
        required
      />
      <Select value={String(formData.overall_rating)} onValueChange={(v) => setFormData((prev) => ({ ...prev, overall_rating: Number(v) }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Overall rating" />
        </SelectTrigger>
        <SelectContent>
          {ratingOptions.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Pros */}
      <div>
        <label className="block mb-1 font-medium">Pros</label>
        <div className="flex space-x-2 mb-2">
          <Input
            placeholder="Add a pro"
            value={newPro}
            onChange={(e) => setNewPro(e.target.value)}
          />
          <Button type="button" onClick={handleAddPro} disabled={!newPro.trim()}>
            Add
          </Button>
        </div>
        <ul className="list-disc list-inside">
          {formData.pros.map((pro, idx) => (
            <li key={idx}>{pro}</li>
          ))}
        </ul>
      </div>
      {/* Cons */}
      <div>
        <label className="block mb-1 font-medium">Cons</label>
        <div className="flex space-x-2 mb-2">
          <Input
            placeholder="Add a con"
            value={newCon}
            onChange={(e) => setNewCon(e.target.value)}
          />
          <Button type="button" onClick={handleAddCon} disabled={!newCon.trim()}>
            Add
          </Button>
        </div>
        <ul className="list-disc list-inside">
          {formData.cons.map((con, idx) => (
            <li key={idx}>{con}</li>
          ))}
        </ul>
      </div>
      <Textarea
        placeholder="Detailed review (markdown)"
        value={formData.detailed_review}
        onChange={(e) => setFormData((prev) => ({ ...prev, detailed_review: e.target.value }))}
        rows={6}
        required
      />
      <Input
        placeholder="Featured image URL"
        value={formData.featured_image}
        onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
        required
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Review' : 'Create Review'}
      </Button>
    </form>
  );
}
