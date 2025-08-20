import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { JobListing, CreateJobListingInput, JobListingFilters } from '../../server/src/schema';

// Import components
import { CreateJobForm } from '@/components/CreateJobForm';
import { JobListingCard } from '@/components/JobListingCard';
import { JobFilters } from '@/components/JobFilters';
import { SampleJobsProvider } from '@/components/SampleJobsProvider';

function App() {
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<JobListingFilters>({
    engineering_discipline: undefined,
    location: ''
  });

  // Load job listings with current filters
  const loadJobListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterInput = {
        engineering_discipline: filters.engineering_discipline,
        location: filters.location || undefined
      };
      const result = await trpc.getJobListings.query(filterInput);
      setJobListings(result);
    } catch (error) {
      console.error('Failed to load job listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobListings();
  }, [loadJobListings]);

  const handleCreateJob = async (formData: CreateJobListingInput) => {
    setIsCreating(true);
    try {
      const newJob = await trpc.createJobListing.mutate(formData);
      setJobListings((prev: JobListing[]) => [newJob, ...prev]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create job listing:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFiltersChange = (newFilters: JobListingFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      engineering_discipline: undefined,
      location: ''
    });
  };

  const handleLoadSampleJobs = (sampleJobs: JobListing[]) => {
    setJobListings(sampleJobs);
  };

  const hasActiveFilters = filters.engineering_discipline || filters.location;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔧 Engineering Jobs Board</h1>
          <p className="text-lg text-gray-600 mb-6">
            Connecting engineers with amazing opportunities
          </p>
          
          {/* Stub Warning */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              ⚠️ <strong>Demo Mode:</strong> This application is using stub data. Job listings created here are not persistent and will reset on page refresh.
            </AlertDescription>
          </Alert>

          {/* Sample Jobs Provider */}
          <SampleJobsProvider 
            onLoadSampleJobs={handleLoadSampleJobs}
            hasExistingJobs={jobListings.length > 0}
          />

          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {showCreateForm ? '❌ Cancel' : '➕ Post New Job'}
          </Button>
        </div>

        {/* Create Job Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateJobForm 
              onSubmit={handleCreateJob}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-6">
          <JobFilters 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={loadJobListings}
            onClear={clearFilters}
            isLoading={isLoading}
            resultCount={jobListings.length}
          />
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-xl text-gray-600">🔄 Loading jobs...</div>
            </div>
          ) : jobListings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or post the first job!'
                    : 'Be the first to post a job opportunity!'
                  }
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  ➕ Post First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">
                  📋 Job Listings ({jobListings.length})
                </h2>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                    Filtered results
                  </Badge>
                )}
              </div>
              
              {jobListings.map((job: JobListing) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 border-t pt-8">
          <p>🔧 Engineering Jobs Board - Connecting talent with opportunity</p>
          <p className="text-sm mt-1">Built with ❤️ for the engineering community</p>
        </div>
      </div>
    </div>
  );
}

export default App;
