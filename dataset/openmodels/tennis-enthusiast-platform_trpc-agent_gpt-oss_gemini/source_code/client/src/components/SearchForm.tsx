import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { SearchPlayersInput, SkillLevel } from '../../../server/src/schema';

interface SearchFormProps {
  onSearch: (criteria: SearchPlayersInput) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [skillLevel, setSkillLevel] = useState<SkillLevel | ''>('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const criteria: SearchPlayersInput = {} as SearchPlayersInput;
    if (skillLevel) criteria.skill_level = skillLevel;
    if (location) criteria.location = location;
    onSearch(criteria);
    setIsLoading(false);
  }, [skillLevel, location, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-background/30">
      <h2 className="text-xl font-semibold">Search Players</h2>
      <Select
        value={skillLevel}
        onValueChange={(value: string) => setSkillLevel(value as SkillLevel)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Skill Level (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
