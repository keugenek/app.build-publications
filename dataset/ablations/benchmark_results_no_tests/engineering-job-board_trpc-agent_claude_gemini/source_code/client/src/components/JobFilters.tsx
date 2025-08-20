import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobListingFilters, EngineeringDiscipline } from '../../../server/src/schema';

// Import engineering disciplines from schema
const engineeringDisciplines = [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial',
  'Other'
] as const;

interface JobFiltersProps {
  filters: JobListingFilters;
  onFiltersChange: (filters: JobListingFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading?: boolean;
  resultCount: number;
}

export function JobFilters({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  onClear, 
  isLoading = false,
  resultCount 
}: JobFiltersProps) {
  const hasActiveFilters = filters.engineering_discipline || filters.location;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">🔍 Filter Jobs</CardTitle>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              {resultCount} filtered results
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engineering Discipline</label>
            <Select
              value={filters.engineering_discipline || 'all'}
              onValueChange={(value: string) =>
                onFiltersChange({
                  ...filters,
                  engineering_discipline: value === 'all' ? undefined : value as EngineeringDiscipline
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                {engineeringDisciplines.map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <Input
              placeholder="Search by location..."
              value={filters.location || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFiltersChange({ ...filters, location: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onSearch}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔍'} Search
            </Button>
            {hasActiveFilters && (
              <Button onClick={onClear} variant="outline">
                ❌ Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
