import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search as SearchIcon } from 'lucide-react';
import type { SearchPlayersInput, SkillLevel } from '../../../server/src/schema';

interface SearchFormProps {
  searchParams: SearchPlayersInput;
  onSearch: (params: SearchPlayersInput) => void;
}

export function SearchForm({ searchParams, onSearch }: SearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleSkillLevelChange = (value: string) => {
    onSearch({
      ...searchParams,
      skill_level: value === 'all' ? undefined : (value as SkillLevel)
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch({
      ...searchParams,
      city: e.target.value || undefined
    });
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5" />
          Find Players
        </CardTitle>
        <CardDescription>Search for tennis partners by skill level and location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Skill Level</label>
              <Select
                value={searchParams.skill_level || 'all'}
                onValueChange={handleSkillLevelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input
                placeholder="Enter city"
                value={searchParams.city || ''}
                onChange={handleCityChange}
              />
            </div>
            
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <SearchIcon className="mr-2 h-4 w-4" />
                Search Players
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
