import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter } from 'lucide-react';
import type { SearchBooksInput, ReadingStatus } from '../../../server/src/schema';

interface SearchFiltersProps {
  filters: SearchBooksInput;
  onFiltersChange: (filters: SearchBooksInput) => void;
  onClear: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onClear }: SearchFiltersProps) {
  const handleInputChange = (field: keyof SearchBooksInput, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        reading_status: undefined
      });
    } else {
      onFiltersChange({
        ...filters,
        reading_status: value as ReadingStatus
      });
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Search & Filter Books</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search-title">Title</Label>
          <Input
            id="search-title"
            placeholder="Search by title..."
            value={filters.title || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('title', e.target.value)
            }
            className="focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-author">Author</Label>
          <Input
            id="search-author"
            placeholder="Search by author..."
            value={filters.author || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('author', e.target.value)
            }
            className="focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-genre">Genre</Label>
          <Input
            id="search-genre"
            placeholder="Search by genre..."
            value={filters.genre || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('genre', e.target.value)
            }
            className="focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-status">Status</Label>
          <Select 
            value={filters.reading_status || 'all'} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🔍 All Statuses</SelectItem>
              <SelectItem value="To Read">📚 To Read</SelectItem>
              <SelectItem value="Reading">📖 Currently Reading</SelectItem>
              <SelectItem value="Finished">✅ Finished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {filters.title && (
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs">
                  Title: "{filters.title}"
                </span>
              )}
              {filters.author && (
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs">
                  Author: "{filters.author}"
                </span>
              )}
              {filters.genre && (
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs">
                  Genre: "{filters.genre}"
                </span>
              )}
              {filters.reading_status && (
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs">
                  Status: {filters.reading_status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
