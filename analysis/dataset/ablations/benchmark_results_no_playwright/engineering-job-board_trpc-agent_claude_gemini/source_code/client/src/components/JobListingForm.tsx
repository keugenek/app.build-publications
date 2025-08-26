import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import type { CreateJobListingInput, EngineeringDiscipline } from '../../../server/src/schema';

interface JobListingFormProps {
  onSubmit: (data: CreateJobListingInput) => Promise<void>;
  disciplines: EngineeringDiscipline[];
}

export function JobListingForm({ onSubmit, disciplines }: JobListingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateJobListingInput>({
    title: '',
    company_name: '',
    location: '',
    engineering_discipline: 'Software',
    description: '',
    requirements: null,
    salary_range: null,
    employment_type: 'Full-time',
    remote_friendly: false
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        title: '',
        company_name: '',
        location: '',
        engineering_discipline: 'Software',
        description: '',
        requirements: null,
        salary_range: null,
        employment_type: 'Full-time',
        remote_friendly: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job listing');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: keyof CreateJobListingInput, value: string | boolean | null) => {
    setFormData((prev: CreateJobListingInput) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-slate-800 border-green-400/30">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Job title *
              </Label>
              <Input
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData('title', e.target.value)
                }
                placeholder="Senior Software Engineer"
                required
                className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Company name *
              </Label>
              <Input
                value={formData.company_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData('company_name', e.target.value)
                }
                placeholder="TechCorp Inc."
                required
                className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Location *
              </Label>
              <Input
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData('location', e.target.value)
                }
                placeholder="San Francisco, CA"
                required
                className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Engineering discipline *
              </Label>
              <Select
                value={formData.engineering_discipline || 'Software'}
                onValueChange={(value: EngineeringDiscipline) =>
                  updateFormData('engineering_discipline', value)
                }
              >
                <SelectTrigger className="bg-slate-700 border-green-400/30 text-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-green-400/30">
                  {disciplines.map((discipline: EngineeringDiscipline) => (
                    <SelectItem key={discipline} value={discipline} className="text-green-400">
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Employment type
              </Label>
              <Select
                value={formData.employment_type || 'Full-time'}
                onValueChange={(value: string) =>
                  updateFormData('employment_type', value)
                }
              >
                <SelectTrigger className="bg-slate-700 border-green-400/30 text-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-green-400/30">
                  <SelectItem value="Full-time" className="text-green-400">Full-time</SelectItem>
                  <SelectItem value="Part-time" className="text-green-400">Part-time</SelectItem>
                  <SelectItem value="Contract" className="text-green-400">Contract</SelectItem>
                  <SelectItem value="Internship" className="text-green-400">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-green-400/70">
                // Salary range
              </Label>
              <Input
                value={formData.salary_range || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData('salary_range', e.target.value || null)
                }
                placeholder="$80,000 - $120,000"
                className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-green-400/70">
              // Job description * (min. 10 characters)
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateFormData('description', e.target.value)
              }
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              required
              rows={4}
              className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-green-400/70">
              // Requirements (optional)
            </Label>
            <Textarea
              value={formData.requirements || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateFormData('requirements', e.target.value || null)
              }
              placeholder="List specific skills, experience, education requirements..."
              rows={3}
              className="bg-slate-700 border-green-400/30 text-green-400 placeholder-green-400/50 resize-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="remote-friendly"
              checked={formData.remote_friendly}
              onCheckedChange={(checked: boolean) =>
                updateFormData('remote_friendly', checked)
              }
              className="data-[state=checked]:bg-green-400"
            />
            <Label htmlFor="remote-friendly" className="text-green-400/70">
              // Remote friendly position
            </Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-green-400/30 text-green-400/70 hover:text-green-400 hover:bg-slate-700"
              onClick={() => {
                // Reset form
                setFormData({
                  title: '',
                  company_name: '',
                  location: '',
                  engineering_discipline: 'Software',
                  description: '',
                  requirements: null,
                  salary_range: null,
                  employment_type: 'Full-time',
                  remote_friendly: false
                });
                setError(null);
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-400/20 border border-green-400/30 text-green-400 hover:bg-green-400/30 hover:text-green-300"
            >
              {isLoading ? '> Publishing...' : '> Publish Job'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
