import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Trophy, RotateCcw } from 'lucide-react';

// Import types from server
import type { SearchUsersInput, SkillLevel } from '../../../server/src/schema';

interface SearchFiltersProps {
  onSearch: (filters: SearchUsersInput) => Promise<void>;
}

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const skillEmojis = {
  Beginner: '🌱',
  Intermediate: '🎾',
  Advanced: '🏆'
};

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchUsersInput>({
    skill_level: undefined,
    location: undefined
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Only include filters that have values
      const activeFilters: SearchUsersInput = {};
      if (filters.skill_level) {
        activeFilters.skill_level = filters.skill_level;
      }
      if (filters.location && filters.location.trim()) {
        activeFilters.location = filters.location.trim();
      }
      
      await onSearch(activeFilters);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = async () => {
    setFilters({
      skill_level: undefined,
      location: undefined
    });
    // Perform search with no filters to show all players
    await handleSearch();
  };

  const hasActiveFilters = filters.skill_level || (filters.location && filters.location.trim());

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Skill Level Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Skill Level
              </Label>
              <Select 
                value={filters.skill_level || 'all'} 
                onValueChange={(value: string) =>
                  setFilters(prev => ({
                    ...prev,
                    skill_level: value === 'all' ? undefined : value as SkillLevel
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="text-gray-500">Any skill level</span>
                  </SelectItem>
                  {skillLevels.map((level: SkillLevel) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <span>{skillEmojis[level]}</span>
                        <span>{level}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label htmlFor="location-filter" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location-filter"
                type="text"
                placeholder="Search by city or area..."
                value={filters.location || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters(prev => ({ ...prev, location: e.target.value || undefined }))
                }
              />
            </div>
          </div>

          {/* Search Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Players
                </>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button 
                onClick={handleReset}
                variant="outline"
                disabled={isSearching}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Search Tips */}
          <div className="pt-2 text-xs text-gray-500 space-y-1">
            <p className="flex items-center gap-2">
              💡 <span>Leave filters empty to see all players</span>
            </p>
            <p className="flex items-center gap-2">
              🔍 <span>Location search works with partial matches (e.g., "Austin" will match "Austin, TX")</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
