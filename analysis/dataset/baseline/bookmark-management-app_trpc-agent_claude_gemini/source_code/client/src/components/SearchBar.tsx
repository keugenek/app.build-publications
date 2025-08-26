import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';
import type { User, Collection, Tag, SearchBookmarksInput } from '../../../server/src/schema';

interface SearchBarProps {
  user: User;
  collections: Collection[];
  tags: Tag[];
  onSearch: (params: SearchBookmarksInput) => void;
  onClear: () => void;
  isSearchActive: boolean;
}

export function SearchBar({
  user,
  collections,
  tags,
  onSearch,
  onClear,
  isSearchActive
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<number | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() && !selectedCollection && selectedTagIds.length === 0) {
      return;
    }

    const searchParams: SearchBookmarksInput = {
      user_id: user.id,
      query: query.trim(),
      collection_id: selectedCollection,
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined
    };

    onSearch(searchParams);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedCollection(undefined);
    setSelectedTagIds([]);
    onClear();
  };

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTagIds((prev: number[]) =>
      checked
        ? [...prev, tagId]
        : prev.filter((id: number) => id !== tagId)
    );
  };

  const hasFilters = selectedCollection !== undefined || selectedTagIds.length > 0;
  const hasActiveSearch = query.trim() || hasFilters;

  return (
    <div className="flex items-center space-x-2">
      <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search bookmarks by title, description, or content..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={hasFilters ? 'bg-blue-50 border-blue-200' : ''}
            >
              <FilterIcon className="h-4 w-4 mr-1" />
              Filters
              {hasFilters && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {(selectedCollection ? 1 : 0) + selectedTagIds.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Collection</Label>
                <Select
                  value={selectedCollection?.toString() || 'all'}
                  onValueChange={(value: string) =>
                    setSelectedCollection(value === 'all' ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All collections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All collections</SelectItem>
                    {collections.map((collection: Collection) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {tags.map((tag: Tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`search-tag-${tag.id}`}
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={(checked: boolean) => handleTagChange(tag.id, checked)}
                        />
                        <Label
                          htmlFor={`search-tag-${tag.id}`}
                          className="text-xs font-normal cursor-pointer truncate"
                        >
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCollection(undefined);
                    setSelectedTagIds([]);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="submit"
          disabled={!hasActiveSearch}
          size="sm"
        >
          Search
        </Button>
      </form>

      {isSearchActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-gray-600 hover:text-gray-900"
        >
          <XIcon className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
