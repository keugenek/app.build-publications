import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Terminal, Zap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { JobListing, CreateJobListingInput, PaginatedJobListings, EngineeringDiscipline } from '../../server/src/schema';
import { JobListingForm } from '@/components/JobListingForm';
import { JobListingCard } from '@/components/JobListingCard';

function App() {
  const [jobListings, setJobListings] = useState<PaginatedJobListings>({
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    engineering_discipline: '' as EngineeringDiscipline | '',
    location: '',
    remote_friendly: undefined as boolean | undefined,
    employment_type: '',
    search_query: ''
  });

  // Engineering disciplines for filter dropdown
  const [disciplines, setDisciplines] = useState<EngineeringDiscipline[]>([]);

  // Load engineering disciplines
  const loadDisciplines = useCallback(async () => {
    try {
      const result = await trpc.getEngineeringDisciplines.query();
      setDisciplines(result);
    } catch (error) {
      console.error('Failed to load engineering disciplines:', error);
    }
  }, []);

  // Load job listings with filters
  const loadJobListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParams = {
        ...filters,
        engineering_discipline: filters.engineering_discipline || undefined,
        location: filters.location || undefined,
        search_query: filters.search_query || undefined,
        employment_type: filters.employment_type || undefined,
        page: 1,
        limit: 20
      };
      
      const result = await trpc.getJobListings.query(filterParams);
      setJobListings(result);
    } catch (error) {
      console.error('Failed to load job listings:', error);
      // Set empty state on error
      setJobListings({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  useEffect(() => {
    loadJobListings();
  }, [loadJobListings]);

  const handleCreateJob = async (data: CreateJobListingInput) => {
    try {
      await trpc.createJobListing.mutate(data);
      // Refresh the job listings to include the new job
      await loadJobListings();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create job listing:', error);
      throw error; // Re-throw to let form handle the error
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      engineering_discipline: '',
      location: '',
      remote_friendly: undefined,
      employment_type: '',
      search_query: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined
  );

  return (
    <div className="min-h-screen bg-slate-950 text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-400/20 bg-slate-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-green-400">
                  &gt; engineering_jobs.exe
                </h1>
                <p className="text-sm text-green-400/70">
                  // Connecting brilliant minds with innovative opportunities
                </p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-400/20 border border-green-400/30 text-green-400 hover:bg-green-400/30 hover:text-green-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-green-400/30 text-green-400 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-green-400">
                    &gt; new_job_posting.init()
                  </DialogTitle>
                </DialogHeader>
                <JobListingForm 
                  onSubmit={handleCreateJob}
                  disciplines={disciplines}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <Card className="bg-slate-900/50 border-green-400/20 mb-8">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              search && filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-green-400/70 mb-2 block">
                  // Search query
                </label>
                <Input
                  placeholder="Search jobs, companies..."
                  value={filters.search_query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange('search_query', e.target.value)
                  }
                  className="bg-slate-800 border-green-400/30 text-green-400 placeholder-green-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-green-400/70 mb-2 block">
                  // Engineering discipline
                </label>
                <Select
                  value={filters.engineering_discipline || 'all'}
                  onValueChange={(value: string) =>
                    handleFilterChange('engineering_discipline', value === 'all' ? '' : value as EngineeringDiscipline)
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-green-400/30 text-green-400">
                    <SelectValue placeholder="All disciplines" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-green-400/30">
                    <SelectItem value="all" className="text-green-400">All disciplines</SelectItem>
                    {disciplines.map((discipline: EngineeringDiscipline) => (
                      <SelectItem key={discipline} value={discipline} className="text-green-400">
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-green-400/70 mb-2 block">
                  // Location
                </label>
                <Input
                  placeholder="City, State, Country..."
                  value={filters.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange('location', e.target.value)
                  }
                  className="bg-slate-800 border-green-400/30 text-green-400 placeholder-green-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-green-400/70 mb-2 block">
                  // Employment type
                </label>
                <Select
                  value={filters.employment_type || 'all'}
                  onValueChange={(value: string) =>
                    handleFilterChange('employment_type', value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-green-400/30 text-green-400">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-green-400/30">
                    <SelectItem value="all" className="text-green-400">All types</SelectItem>
                    <SelectItem value="Full-time" className="text-green-400">Full-time</SelectItem>
                    <SelectItem value="Part-time" className="text-green-400">Part-time</SelectItem>
                    <SelectItem value="Contract" className="text-green-400">Contract</SelectItem>
                    <SelectItem value="Internship" className="text-green-400">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-green-400/70 mb-2 block">
                  // Remote work
                </label>
                <Select
                  value={filters.remote_friendly?.toString() || 'any'}
                  onValueChange={(value: string) =>
                    handleFilterChange('remote_friendly', 
                      value === 'any' ? undefined : value === 'true'
                    )
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-green-400/30 text-green-400">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-green-400/30">
                    <SelectItem value="any" className="text-green-400">Any</SelectItem>
                    <SelectItem value="true" className="text-green-400">Remote friendly</SelectItem>
                    <SelectItem value="false" className="text-green-400">On-site only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-green-400/30 text-green-400/70 hover:text-green-400 hover:bg-slate-800"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-green-400" />
              <h2 className="text-xl font-semibold text-green-400">
                query_results = {jobListings.pagination.total} jobs found
              </h2>
            </div>
            {jobListings.pagination.totalPages > 1 && (
              <div className="text-sm text-green-400/70">
                Page {jobListings.pagination.page} of {jobListings.pagination.totalPages}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-green-400/70">
                &gt; Loading job listings...
              </div>
              <div className="mt-2 text-sm text-green-400/50">
                // Please wait while we fetch the latest opportunities
              </div>
            </div>
          ) : jobListings.data.length === 0 ? (
            <Card className="bg-slate-900/50 border-green-400/20">
              <CardContent className="py-12 text-center">
                <div className="text-green-400/70 mb-2">
                  &gt; No job listings found
                </div>
                <div className="text-sm text-green-400/50">
                  // Try adjusting your search criteria or check back later
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4 border-green-400/30 text-green-400/70 hover:text-green-400 hover:bg-slate-800"
                  >
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {jobListings.data.map((job: JobListing) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
