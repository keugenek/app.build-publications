import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductCategory } from '../../../server/src/schema';

interface CategoryFilterProps {
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
  variant?: 'buttons' | 'select';
  title?: string;
}

export function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  variant = 'buttons',
  title = 'Browse Reviews' 
}: CategoryFilterProps) {
  const categories: Array<{ value: ProductCategory | 'all'; label: string; icon?: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'mice', label: 'Mice', icon: '🖱️' },
    { value: 'keyboards', label: 'Keyboards', icon: '⌨️' },
    { value: 'headsets', label: 'Headsets', icon: '🎧' },
  ];

  if (variant === 'select') {
    return (
      <div className="flex items-center gap-2">
        {title && <span className="text-sm font-medium text-gray-700">{title}:</span>}
        <Select 
          value={selectedCategory} 
          onValueChange={(value) => onCategoryChange(value as ProductCategory | 'all')}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
      <div className="flex gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category.value)}
            size="sm"
            className="transition-all"
          >
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
