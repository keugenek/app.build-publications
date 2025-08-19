import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import type { PlantMood, LightExposure } from '../../../server/src/schema';

interface PlantFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  moodFilter: PlantMood | 'all';
  onMoodFilterChange: (value: PlantMood | 'all') => void;
  lightFilter: LightExposure | 'all';
  onLightFilterChange: (value: LightExposure | 'all') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function PlantFilters({
  searchTerm,
  onSearchChange,
  moodFilter,
  onMoodFilterChange,
  lightFilter,
  onLightFilterChange,
  onClearFilters,
  hasActiveFilters
}: PlantFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-2 text-green-700">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filter Your Plants</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 text-xs text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Search by name/type */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
          <Input
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-8 border-green-200 focus:border-green-400"
          />
        </div>

        {/* Filter by mood */}
        <div>
          <Select value={moodFilter} onValueChange={onMoodFilterChange}>
            <SelectTrigger className="border-green-200 focus:border-green-400">
              <SelectValue placeholder="Filter by mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌱 All Moods</SelectItem>
              <SelectItem value="Happy">😊 Happy</SelectItem>
              <SelectItem value="Thirsty">😅 Thirsty</SelectItem>
              <SelectItem value="Needs Sun">😴 Needs Sun</SelectItem>
              <SelectItem value="Wilting">😵 Wilting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter by light exposure */}
        <div>
          <Select value={lightFilter} onValueChange={onLightFilterChange}>
            <SelectTrigger className="border-green-200 focus:border-green-400">
              <SelectValue placeholder="Filter by light" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">☀️ All Light Levels</SelectItem>
              <SelectItem value="low">🌑 Low Light</SelectItem>
              <SelectItem value="medium">🌤️ Medium Light</SelectItem>
              <SelectItem value="high">☀️ High Light</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Search: "{searchTerm}"
            </Badge>
          )}
          {moodFilter !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Mood: {moodFilter}
            </Badge>
          )}
          {lightFilter !== 'all' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Light: {lightFilter}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
