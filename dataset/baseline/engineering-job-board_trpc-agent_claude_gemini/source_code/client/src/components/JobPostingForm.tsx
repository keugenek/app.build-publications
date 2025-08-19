import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { CreateJobListingInput, JobListing, EngineeringDiscipline } from '../../../server/src/schema';

interface JobPostingFormProps {
  onJobCreated: (job: JobListing) => void;
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

export function JobPostingForm({ onJobCreated }: JobPostingFormProps) {
  const [formData, setFormData] = useState<CreateJobListingInput>({
    title: '',
    description: '',
    engineering_discipline: 'Software',
    location: '',
    company_name: '',
    application_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createJobListing.mutate(formData);
      onJobCreated(response);
      // Reset form
      setFormData({
        title: '',
        description: '',
        engineering_discipline: 'Software',
        location: '',
        company_name: '',
        application_url: ''
      });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create job listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="terminal-border neon-glow mb-8">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-mono gradient-text flex items-center gap-2">
            <span className="text-green-400">&gt;</span> Post New Job
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              EMPLOYER
            </Badge>
          </CardTitle>
          {!isExpanded && (
            <Button 
              onClick={() => setIsExpanded(true)}
              className="bg-green-600 hover:bg-green-700 text-black font-mono"
            >
              <span className="mr-2">+</span> NEW_JOB.exe
            </Button>
          )}
        </div>
        {!isExpanded && (
          <p className="text-slate-400 font-mono text-sm">
            // Initialize job posting protocol
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">
                  job_title = <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="Senior Software Engineer"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateJobListingInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">
                  company_name = <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="TechCorp Industries"
                  value={formData.company_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateJobListingInput) => ({ ...prev, company_name: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">
                  discipline = <span className="text-red-400">*</span>
                </label>
                <Select 
                  value={formData.engineering_discipline} 
                  onValueChange={(value: EngineeringDiscipline) =>
                    setFormData((prev: CreateJobListingInput) => ({ ...prev, engineering_discipline: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {disciplines.map((discipline: EngineeringDiscipline) => (
                      <SelectItem key={discipline} value={discipline} className="font-mono">
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">
                  location = <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="San Francisco, CA / Remote"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateJobListingInput) => ({ ...prev, location: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-mono text-green-400 mb-2 block">
                application_url = <span className="text-red-400">*</span>
              </label>
              <Input
                type="url"
                placeholder="https://company.com/careers/apply"
                value={formData.application_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateJobListingInput) => ({ ...prev, application_url: e.target.value }))
                }
                className="bg-slate-800 border-slate-600 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-sm font-mono text-green-400 mb-2 block">
                job_description = <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Detailed job description, requirements, responsibilities..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateJobListingInput) => ({ ...prev, description: e.target.value }))
                }
                className="bg-slate-800 border-slate-600 font-mono min-h-32"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-black font-mono flex-1"
              >
                {isLoading ? 'EXECUTING...' : 'DEPLOY_JOB()'}
              </Button>
              <Button 
                type="button"
                onClick={() => setIsExpanded(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 font-mono"
              >
                CANCEL
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
