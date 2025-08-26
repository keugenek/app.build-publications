import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Note: Using × symbol instead of lucide-react icon for simplicity
import type { FilterBooksInput, ReadingStatus } from '../../../server/src/schema';

interface BookFiltersProps {
  genres: string[];
  onFiltersChange: (filters: FilterBooksInput) => void;
  currentFilters: FilterBooksInput;
}

const READING_STATUS_OPTIONS: ReadingStatus[] = ['To Read', 'Reading', 'Finished'];

export function BookFilters({ genres, onFiltersChange, currentFilters }: BookFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({
      ...currentFilters,
      search: search || undefined
    });
  };

  const handleGenreChange = (genre: string) => {
    onFiltersChange({
      ...currentFilters,
      genre: genre === 'all' ? undefined : genre
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...currentFilters,
      reading_status: status === 'all' ? undefined : status as ReadingStatus
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = currentFilters.search || currentFilters.genre || currentFilters.reading_status;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                placeholder="Search by title or author..."
                value={currentFilters.search || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Genre Filter */}
            <div className="sm:w-48">
              <Select
                value={currentFilters.genre || 'all'}
                onValueChange={handleGenreChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre: string) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <Select
                value={currentFilters.reading_status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {READING_STATUS_OPTIONS.map((status: ReadingStatus) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters and Clear Button */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              
              {currentFilters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{currentFilters.search}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </Badge>
              )}
              
              {currentFilters.genre && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Genre: {currentFilters.genre}
                  <button
                    onClick={() => handleGenreChange('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </Badge>
              )}
              
              {currentFilters.reading_status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {currentFilters.reading_status}
                  <button
                    onClick={() => handleStatusChange('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
