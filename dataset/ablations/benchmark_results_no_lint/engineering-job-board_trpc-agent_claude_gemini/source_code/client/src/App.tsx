import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { JobListing, CreateJobListingInput, SearchJobListingsInput, EngineeringDiscipline } from '../../server/src/schema';

const ENGINEERING_DISCIPLINES: EngineeringDiscipline[] = [
  'Software',
  'Hardware', 
  'Civil',
  'Mechanical',
  'Electrical',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial'
];

function App() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state for job creation
  const [formData, setFormData] = useState<CreateJobListingInput>({
    title: '',
    company_name: '',
    location: '',
    description: '',
    engineering_discipline: 'Software'
  });
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchJobListingsInput>({
    engineering_discipline: undefined,
    location: undefined,
    search_term: undefined
  });

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getJobListings.query();
      setJobs(result);
      setFilteredJobs(result);
    } catch (error) {
      console.error('Failed to load job listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Apply search filters whenever filters or jobs change
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...jobs];
      
      // Filter by engineering discipline
      if (searchFilters.engineering_discipline) {
        filtered = filtered.filter(job => 
          job.engineering_discipline === searchFilters.engineering_discipline
        );
      }
      
      // Filter by location (case-insensitive partial match)
      if (searchFilters.location && searchFilters.location.trim()) {
        const locationQuery = searchFilters.location.toLowerCase();
        filtered = filtered.filter(job =>
          job.location.toLowerCase().includes(locationQuery)
        );
      }
      
      // Filter by search term (search in title, company, description)
      if (searchFilters.search_term && searchFilters.search_term.trim()) {
        const searchQuery = searchFilters.search_term.toLowerCase();
        filtered = filtered.filter(job =>
          job.title.toLowerCase().includes(searchQuery) ||
          job.company_name.toLowerCase().includes(searchQuery) ||
          job.description.toLowerCase().includes(searchQuery)
        );
      }
      
      setFilteredJobs(filtered);
    };

    applyFilters();
  }, [jobs, searchFilters]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newJob = await trpc.createJobListing.mutate(formData);
      setJobs((prev: JobListing[]) => [newJob, ...prev]);
      setFormData({
        title: '',
        company_name: '',
        location: '',
        description: '',
        engineering_discipline: 'Software'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create job listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisciplineColor = (discipline: EngineeringDiscipline): string => {
    const colors = {
      Software: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      Hardware: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      Civil: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      Mechanical: 'bg-red-100 text-red-800 hover:bg-red-200',
      Electrical: 'bg-green-100 text-green-800 hover:bg-green-200',
      Chemical: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      Aerospace: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      Biomedical: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      Environmental: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      Industrial: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    return colors[discipline];
  };

  const clearFilters = () => {
    setSearchFilters({
      engineering_discipline: undefined,
      location: undefined,
      search_term: undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔧 Engineering Jobs Board</h1>
          <p className="text-lg text-gray-600">Find your next engineering opportunity</p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔍 Search & Filter Jobs</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    ➕ Post New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post a New Engineering Job</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateJobListingInput) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="Senior Software Engineer"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          value={formData.company_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateJobListingInput) => ({ ...prev, company_name: e.target.value }))
                          }
                          placeholder="Tech Corp Inc."
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateJobListingInput) => ({ ...prev, location: e.target.value }))
                          }
                          placeholder="San Francisco, CA"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="discipline">Engineering Discipline *</Label>
                        <Select 
                          value={formData.engineering_discipline}
                          onValueChange={(value: EngineeringDiscipline) =>
                            setFormData((prev: CreateJobListingInput) => ({ ...prev, engineering_discipline: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ENGINEERING_DISCIPLINES.map((discipline: EngineeringDiscipline) => (
                              <SelectItem key={discipline} value={discipline}>
                                {discipline}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Job Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateJobListingInput) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Describe the role, responsibilities, requirements, and benefits..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? 'Posting...' : 'Post Job'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Jobs</Label>
                <Input
                  id="search"
                  value={searchFilters.search_term || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchFilters((prev: SearchJobListingsInput) => ({ 
                      ...prev, 
                      search_term: e.target.value || undefined 
                    }))
                  }
                  placeholder="Search title, company, description..."
                />
              </div>
              
              <div>
                <Label htmlFor="discipline-filter">Engineering Discipline</Label>
                <Select
                  value={searchFilters.engineering_discipline || 'all'}
                  onValueChange={(value: string) =>
                    setSearchFilters((prev: SearchJobListingsInput) => ({
                      ...prev,
                      engineering_discipline: value === 'all' ? undefined : value as EngineeringDiscipline
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Disciplines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Disciplines</SelectItem>
                    {ENGINEERING_DISCIPLINES.map((discipline: EngineeringDiscipline) => (
                      <SelectItem key={discipline} value={discipline}>
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location-filter">Location</Label>
                <Input
                  id="location-filter"
                  value={searchFilters.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchFilters((prev: SearchJobListingsInput) => ({ 
                      ...prev, 
                      location: e.target.value || undefined 
                    }))
                  }
                  placeholder="Filter by location..."
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-blue-600">{filteredJobs.length}</span> of{' '}
            <span className="font-semibold">{jobs.length}</span> engineering positions
          </p>
        </div>

        {/* Job Listings */}
        {isLoading && jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job listings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              {jobs.length === 0 ? (
                <div>
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Jobs Posted Yet</h3>
                  <p className="text-gray-600 mb-6">Be the first to post an engineering position!</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Post the First Job
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Jobs Match Your Search</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing filters.</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job: JobListing) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                        <Badge className={getDisciplineColor(job.engineering_discipline)}>
                          {job.engineering_discipline}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          🏢 <strong>{job.company_name}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          📍 {job.location}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          📅 Posted {job.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-gray-700 leading-relaxed">
                    {job.description.length > 300 ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <p className="inline">
                            {job.description.substring(0, 300)}...{' '}
                            <span className="text-blue-600 font-medium group-open:hidden">
                              Read more →
                            </span>
                          </p>
                        </summary>
                        <p className="mt-2">{job.description.substring(300)}</p>
                        <span className="text-blue-600 font-medium text-sm">← Show less</span>
                      </details>
                    ) : (
                      <p>{job.description}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Last updated: {job.updated_at.toLocaleDateString()}
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Apply Now 📧
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
