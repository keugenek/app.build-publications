import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import type { CreateJobListingInput, EngineeringDiscipline } from '../../../server/src/schema';

// Import engineering disciplines from schema
const engineeringDisciplines = [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial',
  'Other'
] as const;

interface CreateJobFormProps {
  onSubmit: (data: CreateJobListingInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CreateJobForm({ onSubmit, onCancel, isLoading = false }: CreateJobFormProps) {
  const [formData, setFormData] = useState<CreateJobListingInput>({
    job_title: '',
    company_name: '',
    engineering_discipline: 'Software',
    location: '',
    job_description: '',
    application_link: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      job_title: '',
      company_name: '',
      engineering_discipline: 'Software',
      location: '',
      job_description: '',
      application_link: ''
    });
  };

  return (
    <Card className="shadow-lg border-indigo-200">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="text-indigo-900">Post a New Engineering Job</CardTitle>
        <CardDescription>Fill out the details below to create a job listing</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <Input
                placeholder="e.g. Senior Software Engineer"
                value={formData.job_title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateJobListingInput) => ({ ...prev, job_title: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input
                placeholder="e.g. Tech Corp Inc."
                value={formData.company_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateJobListingInput) => ({ ...prev, company_name: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineering Discipline</label>
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
                  {engineeringDisciplines.map((discipline) => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input
                placeholder="e.g. San Francisco, CA or Remote"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateJobListingInput) => ({ ...prev, location: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <Textarea
              placeholder="Describe the role, requirements, and what makes this opportunity exciting..."
              value={formData.job_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateJobListingInput) => ({ ...prev, job_description: e.target.value }))
              }
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
            <Input
              placeholder="https://company.com/apply or careers@company.com"
              value={formData.application_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateJobListingInput) => ({ ...prev, application_link: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? '🔄 Creating Job...' : '🚀 Post Job'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              ❌ Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
