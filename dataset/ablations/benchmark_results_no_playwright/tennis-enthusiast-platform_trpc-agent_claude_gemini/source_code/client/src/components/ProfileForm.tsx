import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, User, FileText, Trophy } from 'lucide-react';

// Import types from server - counting path levels from components/
import type { CreateUserProfileInput, UserProfile, SkillLevel } from '../../../server/src/schema';

interface ProfileFormProps {
  onSubmit: (data: CreateUserProfileInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: UserProfile;
}

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const skillDescriptions = {
  Beginner: 'New to tennis or playing recreationally',
  Intermediate: 'Comfortable with basic strokes and game strategy',
  Advanced: 'Competitive player with strong technical skills'
};

const skillEmojis = {
  Beginner: '🌱',
  Intermediate: '🎾',
  Advanced: '🏆'
};

export function ProfileForm({ onSubmit, isLoading = false, initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState<CreateUserProfileInput>({
    name: '',
    bio: null,
    skill_level: 'Beginner',
    location: ''
  });

  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        bio: initialData.bio,
        skill_level: initialData.skill_level,
        location: initialData.location
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    
    // Reset form if this was a create operation (no initial data)
    if (!initialData) {
      setFormData({
        name: '',
        bio: null,
        skill_level: 'Beginner',
        location: ''
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserProfileInput) => ({ ...prev, name: e.target.value }))
              }
              required
              className="transition-colors focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500">This will be displayed to other players</p>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell other players about yourself, your playing style, availability, or what you're looking for in a tennis partner..."
              value={formData.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateUserProfileInput) => ({
                  ...prev,
                  bio: e.target.value || null
                }))
              }
              rows={4}
              maxLength={500}
              className="transition-colors focus:border-green-500 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-500">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>

          {/* Skill Level Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4" />
              Tennis Skill Level
            </Label>
            <Select 
              value={formData.skill_level || 'Beginner'} 
              onValueChange={(value: SkillLevel) =>
                setFormData((prev: CreateUserProfileInput) => ({ ...prev, skill_level: value }))
              }
            >
              <SelectTrigger className="transition-colors focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Select your skill level" />
              </SelectTrigger>
              <SelectContent>
                {skillLevels.map((level: SkillLevel) => (
                  <SelectItem key={level} value={level} className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{skillEmojis[level]}</span>
                      <div>
                        <div className="font-medium">{level}</div>
                        <div className="text-xs text-gray-500">{skillDescriptions[level]}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Help others find players at their level
            </p>
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="City, State or general area (e.g., Austin, TX)"
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserProfileInput) => ({ ...prev, location: e.target.value }))
              }
              required
              className="transition-colors focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500">
              Other players in your area will be able to find you
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim() || !formData.location.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? 'Updating Profile...' : 'Creating Profile...'}
                </>
              ) : (
                <>
                  {initialData ? 'Update Profile' : 'Create Profile'}
                  <span className="ml-2">🎾</span>
                </>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Your profile helps other tennis players find and connect with you
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
