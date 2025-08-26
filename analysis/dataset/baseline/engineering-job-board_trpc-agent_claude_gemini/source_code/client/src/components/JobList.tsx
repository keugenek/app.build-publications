import { useState } from 'react';
import { JobCard } from './JobCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, MapPin, Building, Calendar, Code, FileText } from 'lucide-react';
import type { JobListing } from '../../../server/src/schema';

interface JobListProps {
  jobs: JobListing[];
  isLoading?: boolean;
}

const disciplineIcons: Record<string, string> = {
  'Software': '💻',
  'Electrical': '⚡',
  'Mechanical': '⚙️',
  'Civil': '🏗️',
  'Chemical': '🧪',
  'Aerospace': '🚀',
  'Biomedical': '🧬',
  'Industrial': '🏭',
  'Environmental': '🌱',
  'Materials': '🔬',
  'Nuclear': '☢️',
  'Other': '🔧'
};

const disciplineColors: Record<string, string> = {
  'Software': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Electrical': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Mechanical': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Civil': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Chemical': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Aerospace': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Biomedical': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Industrial': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Environmental': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Materials': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Nuclear': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Other': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export function JobList({ jobs, isLoading = false }: JobListProps) {
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="terminal-border p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-slate-800 rounded mb-4 w-2/3"></div>
            <div className="h-16 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="terminal-border p-12 text-center">
        <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-mono text-slate-400 mb-2">No Jobs Found</h3>
        <p className="text-slate-500 font-mono text-sm">
          // No job listings match your search criteria
        </p>
        <p className="text-slate-600 font-mono text-xs mt-2">
          Try adjusting your filters or check back later for new opportunities
        </p>
      </div>
    );
  }

  const disciplineIcon = selectedJob ? disciplineIcons[selectedJob.engineering_discipline] || '🔧' : '';
  const disciplineColor = selectedJob ? disciplineColors[selectedJob.engineering_discipline] || 'bg-slate-500/20 text-slate-400 border-slate-500/30' : '';

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job: JobListing) => (
          <JobCard 
            key={job.id} 
            job={job} 
            onClick={() => setSelectedJob(job)}
          />
        ))}
      </div>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          {selectedJob && (
            <>
              <DialogHeader className="pb-4 border-b border-slate-700">
                <DialogTitle className="text-2xl font-mono gradient-text flex items-center gap-3">
                  <span className="text-green-400">&gt;</span>
                  {selectedJob.title}
                  <Badge variant="secondary" className={`${disciplineColor} font-mono`}>
                    {disciplineIcon} {selectedJob.engineering_discipline}
                  </Badge>
                </DialogTitle>
                
                <div className="flex items-center gap-6 text-sm text-slate-400 font-mono mt-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>{selectedJob.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Posted: {formatDate(selectedJob.created_at)}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-6">
                <div>
                  <h4 className="text-lg font-mono text-green-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    job.description()
                  </h4>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <pre className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedJob.description}
                    </pre>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-mono text-blue-400">// Job Details</h5>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Position:</span>
                        <span className="text-slate-200">{selectedJob.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Company:</span>
                        <span className="text-slate-200">{selectedJob.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-slate-200">{selectedJob.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discipline:</span>
                        <span className="text-slate-200">{selectedJob.engineering_discipline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-mono text-blue-400">// Metadata</h5>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Job ID:</span>
                        <span className="text-slate-200">#{selectedJob.id.toString().padStart(6, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-slate-200">{formatDate(selectedJob.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Updated:</span>
                        <span className="text-slate-200">{formatDate(selectedJob.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.open(selectedJob.application_url, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-black font-mono flex-1"
                    size="lg"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LAUNCH_APPLICATION()
                  </Button>
                  <Button 
                    onClick={() => setSelectedJob(null)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 font-mono"
                    size="lg"
                  >
                    CLOSE()
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
