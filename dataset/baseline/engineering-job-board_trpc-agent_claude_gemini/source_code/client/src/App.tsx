import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { JobPostingForm } from '@/components/JobPostingForm';
import { JobFilters } from '@/components/JobFilters';
import { JobList } from '@/components/JobList';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Terminal, Briefcase, Users, Search } from 'lucide-react';
import './App.css';
import type { JobListing, EngineeringDiscipline } from '../../server/src/schema';

function App() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all jobs on mount
  const loadAllJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getAllJobs.query();
      setJobs(result);
      setFilteredJobs(result);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllJobs();
  }, [loadAllJobs]);

  // Handle job creation
  const handleJobCreated = (newJob: JobListing) => {
    setJobs((prev: JobListing[]) => [newJob, ...prev]);
    setFilteredJobs((prev: JobListing[]) => [newJob, ...prev]);
  };

  // Handle search and filtering
  const handleSearch = async (filters: {
    keyword?: string;
    engineering_discipline?: EngineeringDiscipline;
    location?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // If no filters applied, show all jobs
      if (!filters.keyword && !filters.engineering_discipline && !filters.location) {
        const result = await trpc.getAllJobs.query();
        setFilteredJobs(result);
      } else {
        // Use search API with filters
        const result = await trpc.searchJobs.query({
          keyword: filters.keyword,
          engineering_discipline: filters.engineering_discipline,
          location: filters.location,
          limit: 50,
          offset: 0
        });
        setFilteredJobs(result);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to client-side filtering if API fails
      const filtered = jobs.filter((job: JobListing) => {
        const keywordMatch = !filters.keyword || 
          job.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(filters.keyword.toLowerCase());
        
        const disciplineMatch = !filters.engineering_discipline || 
          job.engineering_discipline === filters.engineering_discipline;
        
        const locationMatch = !filters.location ||
          job.location.toLowerCase().includes(filters.location.toLowerCase());
        
        return keywordMatch && disciplineMatch && locationMatch;
      });
      setFilteredJobs(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  const getJobStats = () => {
    const totalJobs = jobs.length;
    const disciplines = new Set(jobs.map((job: JobListing) => job.engineering_discipline)).size;
    const companies = new Set(jobs.map((job: JobListing) => job.company_name)).size;
    return { totalJobs, disciplines, companies };
  };

  const stats = getJobStats();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-green-400" />
              <h1 className="text-2xl font-mono gradient-text font-bold">
                EngineerJobs.dev
              </h1>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 font-mono">
                v2.0.1
              </Badge>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <Briefcase className="w-4 h-4" />
                <span>{stats.totalJobs} jobs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="w-4 h-4" />
                <span>{stats.disciplines} disciplines</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4" />
                <span>{stats.companies} companies</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-mono gradient-text font-bold mb-4">
            Engineering Job Board
          </h2>
          <p className="text-slate-400 font-mono text-lg max-w-2xl mx-auto">
            // Connect talented engineers with innovative companies
            <br />
            <span className="text-slate-500">
              Find your next challenge or post opportunities for top engineering talent
            </span>
          </p>
        </div>

        {/* Stats Display */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="terminal-border p-4 text-center">
            <div className="text-3xl font-mono text-green-400 mb-2">{stats.totalJobs}</div>
            <div className="text-slate-400 font-mono text-sm">Active Positions</div>
          </div>
          <div className="terminal-border p-4 text-center">
            <div className="text-3xl font-mono text-blue-400 mb-2">{stats.disciplines}</div>
            <div className="text-slate-400 font-mono text-sm">Engineering Disciplines</div>
          </div>
          <div className="terminal-border p-4 text-center">
            <div className="text-3xl font-mono text-purple-400 mb-2">{stats.companies}</div>
            <div className="text-slate-400 font-mono text-sm">Hiring Companies</div>
          </div>
        </div>

        <Separator className="bg-slate-700 mb-8" />

        {/* Job Posting Form */}
        <JobPostingForm onJobCreated={handleJobCreated} />

        {/* Job Filters */}
        <JobFilters onSearch={handleSearch} />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-mono text-slate-200">
            <span className="text-green-400">&gt;</span> Job Listings 
            <span className="text-slate-500 text-sm ml-2">
              ({filteredJobs.length} {filteredJobs.length === 1 ? 'result' : 'results'})
            </span>
          </h3>
          {filteredJobs.length !== jobs.length && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
              FILTERED
            </Badge>
          )}
        </div>

        {/* Job Listings */}
        <JobList jobs={filteredJobs} isLoading={isLoading} />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800">
          <div className="text-center text-slate-500 font-mono text-sm">
            <p>// Built for engineers, by engineers</p>
            <p className="text-xs mt-2">
              Connecting innovation with talent across all engineering disciplines
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
