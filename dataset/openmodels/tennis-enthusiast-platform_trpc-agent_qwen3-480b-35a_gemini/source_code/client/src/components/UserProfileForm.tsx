import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CreateUserProfileInput, SkillLevel } from '../../../server/src/schema';

interface UserProfileFormProps {
  onSubmit: (data: CreateUserProfileInput) => Promise<void>;
  isLoading: boolean;
}

export function UserProfileForm({ onSubmit, isLoading }: UserProfileFormProps) {
  const [formData, setFormData] = useState<CreateUserProfileInput>({
    name: '',
    skill_level: 'Beginner',
    city: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle>Create Your Profile</CardTitle>
        <CardDescription>Join our community of tennis players</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input
                placeholder="Enter your city"
                value={formData.city}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, city: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Skill Level</label>
              <Select
                value={formData.skill_level}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, skill_level: value as SkillLevel }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
