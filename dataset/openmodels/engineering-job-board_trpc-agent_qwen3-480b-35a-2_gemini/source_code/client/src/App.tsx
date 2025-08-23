import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Job, CreateJobInput, FilterJobsInput, EngineeringDiscipline, Location } from '../../server/src/schema';

// Import the discipline and location enums from schema
import { engineeringDisciplines, locations } from '../../server/src/schema';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterJobsInput>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState<CreateJobInput>({
    title: '',
    description: '',
    discipline: 'Software Engineering',
    location: 'Remote',
    company_name: '',
    application_link: ''
  });

  const loadJobs = useCallback(async () => {
    try {
      const result = await trpc.getJobs.query(filters);
      setJobs(result);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createJob.mutate(formData);
      setJobs((prev: Job[]) => [...prev, response]);
      setFormData({
        title: '',
        description: '',
        discipline: 'Software Engineering',
        location: 'Remote',
        company_name: '',
        application_link: ''
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterJobsInput, value: EngineeringDiscipline | Location | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Engineering Job Board
          </h1>
          <p className="text-xl text-muted-foreground">
            Find your next engineering opportunity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Job posting form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Post a Job</CardTitle>
                <CardDescription>
                  Add a new engineering position to the board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsFormOpen(!isFormOpen)} 
                  className="w-full mb-4"
                >
                  {isFormOpen ? 'Cancel' : 'Add New Job'}
                </Button>

                {isFormOpen && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={formData.company_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, company_name: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="discipline">Engineering Discipline</Label>
                      <Select
                        value={formData.discipline}
                        onValueChange={(value: EngineeringDiscipline) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, discipline: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {engineeringDisciplines.map((discipline) => (
                            <SelectItem key={discipline} value={discipline}>
                              {discipline}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value: Location) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, location: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="application_link">Application Link</Label>
                      <Input
                        id="application_link"
                        type="url"
                        value={formData.application_link}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, application_link: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateJobInput) => ({ ...prev, description: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Posting...' : 'Post Job'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content - Job listings and filters */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Job Listings</CardTitle>
                    <CardDescription>
                      Browse engineering positions
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="filter-discipline" className="text-xs">Filter by Discipline</Label>
                    <Select
                      value={filters.discipline || 'all'}
                      onValueChange={(value: EngineeringDiscipline | 'all') => 
                        handleFilterChange('discipline', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger id="filter-discipline">
                        <SelectValue placeholder="All Disciplines" />
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

                  <div className="flex-1">
                    <Label htmlFor="filter-location" className="text-xs">Filter by Location</Label>
                    <Select
                      value={filters.location || 'all'}
                      onValueChange={(value: Location | 'all') => 
                        handleFilterChange('location', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger id="filter-location">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Job listings */}
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No jobs found matching your criteria. 
                        {filters.discipline || filters.location ? ' Try adjusting your filters.' : ' Be the first to post a job!'}
                      </p>
                    </div>
                  ) : (
                    jobs.map((job: Job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <h3 className="text-xl font-bold">{job.title}</h3>
                              <p className="text-muted-foreground">{job.company_name}</p>
                            </div>
                            <Badge variant="secondary">{job.location}</Badge>
                          </div>
                          
                          <div className="my-4">
                            <Badge variant="outline">{job.discipline}</Badge>
                          </div>
                          
                          <p className="text-sm mb-4 line-clamp-3">{job.description}</p>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              Posted: {job.created_at.toLocaleDateString()}
                            </div>
                            <Button asChild>
                              <a href={job.application_link} target="_blank" rel="noopener noreferrer">
                                Apply Now
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
