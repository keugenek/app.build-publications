import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { JobCard } from '@/components/JobCard';
import { JobPostForm } from '@/components/JobPostForm';
import { trpc } from '@/utils/trpc';
import type { JobListing, FilterJobListingsInput, EngineeringDiscipline } from '../../server/src/schema';

// Define allowed engineering disciplines (same as in server)
const engineeringDisciplines = [
  'Software Engineering',
  'Data Engineering',
  'DevOps Engineering',
  'Machine Learning Engineering',
  'Security Engineering',
  'Frontend Engineering',
  'Backend Engineering',
  'Full Stack Engineering',
  'Embedded Systems Engineering',
  'Cloud Engineering',
  'Infrastructure Engineering',
  'Quality Assurance Engineering',
  'Site Reliability Engineering',
  'Systems Engineering',
  'Mobile Engineering',
  'Game Development',
  'Blockchain Engineering',
  'AI Engineering',
] as const;

function App() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterJobListingsInput>({
    discipline: undefined,
    location: undefined
  });

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getJobListings.query(filters);
      setJobs(result);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleFilterChange = (key: keyof FilterJobListingsInput, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({
      discipline: undefined,
      location: undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Engineering Jobs Board</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find your next engineering role or post opportunities for talented professionals
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Filters and Post Job */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post a Job</CardTitle>
                <CardDescription>Reach talented engineers with your opportunity</CardDescription>
              </CardHeader>
              <CardContent>
                <JobPostForm onJobPosted={loadJobs} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filter Jobs</CardTitle>
                <CardDescription>Refine your job search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discipline">Engineering Discipline</Label>
                  <Select 
                    value={filters.discipline || 'all'} 
                    onValueChange={(value) => handleFilterChange('discipline', value === 'all' ? undefined : (value as EngineeringDiscipline))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discipline" />
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

                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Input 
                    id="location-filter"
                    placeholder="e.g. San Francisco, Remote"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content - Job listings */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Available Positions</h2>
              <p className="text-muted-foreground">{jobs.length} jobs found</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or check back later</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
