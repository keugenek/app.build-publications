import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { SearchPartnersInput } from '../../../server/src/schema';

interface SearchFormProps {
  onSearch: (filters: SearchPartnersInput) => Promise<void>;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [searchForm, setSearchForm] = useState<SearchPartnersInput>({
    skill_level: '',
    location: '',
    limit: 20
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: SearchPartnersInput = {
      limit: searchForm.limit
    };
    
    if (searchForm.skill_level?.trim()) {
      filters.skill_level = searchForm.skill_level;
    }
    
    if (searchForm.location?.trim()) {
      filters.location = searchForm.location;
    }

    await onSearch(filters);
  };

  const clearSearch = () => {
    setSearchForm({
      skill_level: '',
      location: '',
      limit: 20
    });
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-emerald-50/50 glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 gradient-text">
          <span className="tennis-bounce">🔍</span>
          <span>Search Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>🏆</span>
                <span>Skill Level</span>
              </label>
              <Input
                placeholder="e.g., Beginner, Intermediate..."
                value={searchForm.skill_level || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchForm((prev: SearchPartnersInput) => ({
                    ...prev,
                    skill_level: e.target.value || undefined
                  }))
                }
                className="tennis-input border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>📍</span>
                <span>Location</span>
              </label>
              <Input
                placeholder="e.g., Austin, TX"
                value={searchForm.location || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchForm((prev: SearchPartnersInput) => ({
                    ...prev,
                    location: e.target.value || undefined
                  }))
                }
                className="tennis-input border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg tennis-button"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Searching...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Search Partners</span>
                </span>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearSearch} 
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
