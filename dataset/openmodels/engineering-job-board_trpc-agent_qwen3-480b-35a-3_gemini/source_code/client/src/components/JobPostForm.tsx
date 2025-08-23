import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { CreateJobListingInput, EngineeringDiscipline } from '../../../server/src/schema';

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

export function JobPostForm({ onJobPosted }: { onJobPosted: () => void }) {
  const [formData, setFormData] = useState<CreateJobListingInput>({
    title: '',
    description: '',
    discipline: 'Software Engineering',
    location: '',
    company_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createJobListing.mutate(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        discipline: 'Software Engineering',
        location: '',
        company_name: ''
      });
      onJobPosted();
    } catch (error) {
      console.error('Failed to create job listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company Name</Label>
        <Input
          id="company"
          value={formData.company_name}
          onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g. San Francisco, CA or Remote"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discipline">Engineering Discipline</Label>
        <Select
          value={formData.discipline}
          onValueChange={(value: EngineeringDiscipline) => setFormData(prev => ({ ...prev, discipline: value }))}
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

      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={5}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post Job'}
      </Button>
    </form>
  );
}
