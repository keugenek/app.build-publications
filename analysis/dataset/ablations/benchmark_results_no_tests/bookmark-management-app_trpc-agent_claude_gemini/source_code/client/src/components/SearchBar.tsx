import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Collection, Tag } from '../../../server/src/schema';

interface SearchBarProps {
  collections: Collection[];
  tags: Tag[];
  onSearch: (query: string, collectionId?: number, tagIds?: number[]) => void;
  onClear: () => void;
}

export function SearchBar({ collections, tags, onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedCollection && selectedTags.length === 0) {
      onClear();
      return;
    }
    onSearch(query, selectedCollection, selectedTags.length > 0 ? selectedTags : undefined);
    setIsAdvancedOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedCollection(undefined);
    setSelectedTags([]);
    onClear();
    setIsAdvancedOpen(false);
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev: number[]) =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getSelectedTagNames = (): string => {
    if (selectedTags.length === 0) return '';
    const tagNames = selectedTags
      .map(tagId => tags.find(t => t.id === tagId)?.name)
      .filter(Boolean);
    return tagNames.join(', ');
  };

  const getSelectedCollectionName = (): string => {
    if (!selectedCollection) return '';
    return collections.find(c => c.id === selectedCollection)?.name || '';
  };

  const hasFilters = selectedCollection || selectedTags.length > 0;

  return (
    <div className="flex items-center space-x-2">
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search bookmarks..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="w-64 pr-8"
          />
          {(query || hasFilters) && (
            <Button
              type="button"
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
        
        <Button type="submit" size="sm">
          🔍
        </Button>
        
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={hasFilters ? 'border-blue-500 text-blue-600' : ''}
            >
              🎯 Filters{hasFilters && ` (${selectedTags.length + (selectedCollection ? 1 : 0)})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Advanced Search</CardTitle>
                <CardDescription className="text-xs">
                  Filter bookmarks by collection and tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Collection Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Collection</label>
                  <Select
                    value={selectedCollection?.toString() || ''}
                    onValueChange={(value: string) =>
                      setSelectedCollection(value ? parseInt(value) : undefined)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Any collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any collection</SelectItem>
                      {collections.map((collection: Collection) => (
                        <SelectItem key={collection.id} value={collection.id.toString()}>
                          📁 {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Tag Filters */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Tags</label>
                  {tags.length === 0 ? (
                    <p className="text-xs text-gray-500">No tags available</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {tags.map((tag: Tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-primary/80 text-xs"
                          style={
                            selectedTags.includes(tag.id) && tag.color
                              ? { backgroundColor: tag.color, borderColor: tag.color }
                              : {}
                          }
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {hasFilters && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Active Filters</label>
                      <div className="space-y-1">
                        {selectedCollection && (
                          <Badge variant="secondary" className="text-xs">
                            📁 {getSelectedCollectionName()}
                          </Badge>
                        )}
                        {selectedTags.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            🏷️ {getSelectedTagNames()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={!hasFilters && !query}
                  >
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSearch({ preventDefault: () => {} } as React.FormEvent)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </form>
    </div>
  );
}
