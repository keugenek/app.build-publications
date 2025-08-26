import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ReadingStatus } from '../../../server/src/schema';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genreFilter: string;
  onGenreFilterChange: (value: string) => void;
  statusFilter: ReadingStatus | 'all';
  onStatusFilterChange: (value: ReadingStatus | 'all') => void;
  genres: string[];
  onClearFilters: () => void;
  resultsCount: number;
}

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  genreFilter,
  onGenreFilterChange,
  statusFilter,
  onStatusFilterChange,
  genres,
  onClearFilters,
  resultsCount
}: SearchAndFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = searchTerm || genreFilter !== 'all' || statusFilter !== 'all';
  const activeFilterCount = [
    searchTerm,
    genreFilter !== 'all' ? genreFilter : null,
    statusFilter !== 'all' ? statusFilter : null
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Main search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter toggle and results count */}
        <div className="flex justify-between items-center mb-4">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <span>⚙️ Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <span className="text-xs">{isFiltersOpen ? '▲' : '▼'}</span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Genre Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Genre</label>
                  <Select value={genreFilter} onValueChange={onGenreFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres.map((genre: string) => (
                        <SelectItem key={genre} value={genre}>
                          🏷️ {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reading Status</label>
                  <Select value={statusFilter} onValueChange={(value: ReadingStatus | 'all') => onStatusFilterChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Read">✅ Read</SelectItem>
                      <SelectItem value="Currently Reading">📖 Currently Reading</SelectItem>
                      <SelectItem value="Want to Read">🔖 Want to Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {resultsCount} book{resultsCount !== 1 ? 's' : ''} found
            </span>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                🔍 "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </Badge>
            )}
            {genreFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                🏷️ {genreFilter}
                <button
                  onClick={() => onGenreFilterChange('all')}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {statusFilter === 'Read' && '✅'}
                {statusFilter === 'Currently Reading' && '📖'}
                {statusFilter === 'Want to Read' && '🔖'}
                {' ' + statusFilter}
                <button
                  onClick={() => onStatusFilterChange('all')}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
