import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import type { EngineeringDiscipline } from '../../../server/src/schema';

interface JobFiltersProps {
  onSearch: (filters: {
    keyword?: string;
    engineering_discipline?: EngineeringDiscipline;
    location?: string;
  }) => void;
}

const disciplines: EngineeringDiscipline[] = [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Industrial',
  'Environmental',
  'Materials',
  'Nuclear',
  'Other'
];

export function JobFilters({ onSearch }: JobFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [discipline, setDiscipline] = useState<EngineeringDiscipline | 'all'>('all');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    onSearch({
      keyword: keyword || undefined,
      engineering_discipline: discipline === 'all' ? undefined : discipline,
      location: location || undefined
    });
  };

  const handleReset = () => {
    setKeyword('');
    setDiscipline('all');
    setLocation('');
    onSearch({});
  };

  const hasActiveFilters = keyword || discipline !== 'all' || location;

  return (
    <Card className="terminal-border mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-green-400" />
          <h3 className="font-mono text-green-400">Search Parameters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              ACTIVE
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-mono text-slate-300 mb-2 block">
              keyword_search()
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search jobs, skills, technologies..."
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                className="bg-slate-800 border-slate-600 font-mono pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-mono text-slate-300 mb-2 block">
              filter_discipline()
            </label>
            <Select value={discipline} onValueChange={(value: EngineeringDiscipline | 'all') => setDiscipline(value)}>
              <SelectTrigger className="bg-slate-800 border-slate-600 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all" className="font-mono">All Disciplines</SelectItem>
                {disciplines.map((disc: EngineeringDiscipline) => (
                  <SelectItem key={disc} value={disc} className="font-mono">
                    {disc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-mono text-slate-300 mb-2 block">
              filter_location()
            </label>
            <Input
              placeholder="City, State, Remote..."
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-800 border-slate-600 font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
          <Button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
          >
            <Search className="w-4 h-4 mr-2" />
            EXECUTE_SEARCH()
          </Button>
          {hasActiveFilters && (
            <Button 
              onClick={handleReset}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 font-mono"
            >
              <X className="w-4 h-4 mr-2" />
              CLEAR_FILTERS()
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
