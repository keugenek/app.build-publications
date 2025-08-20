import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { User, UpdateUserInput, SkillLevel } from '../../../server/src/schema';

interface ProfileFormProps {
  currentUser: User;
  onProfileUpdate: (user: User) => void;
}

export function ProfileForm({ currentUser, onProfileUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserInput>({
    id: currentUser.id,
    name: currentUser.name,
    skill_level: currentUser.skill_level,
    location: currentUser.location,
    bio: currentUser.bio
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Note: This uses stub data since the backend handler is not fully implemented
      const updatedUser = await trpc.updateUser.mutate(formData);
      onProfileUpdate(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const skillLevelColors = {
    beginner: 'bg-blue-100 text-blue-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const skillLevelEmojis = {
    beginner: '🟢',
    intermediate: '🟡', 
    advanced: '🔴'
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Profile Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600">Full Name</Label>
              <p className="text-lg font-semibold text-gray-800 mt-1">{currentUser.name}</p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-lg text-gray-800 mt-1">{currentUser.email}</p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600">Skill Level</Label>
              <div className="mt-2">
                <Badge className={skillLevelColors[currentUser.skill_level]}>
                  {skillLevelEmojis[currentUser.skill_level]} {currentUser.skill_level}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600">Location</Label>
              <p className="text-lg text-gray-800 mt-1">📍 {currentUser.location}</p>
            </CardContent>
          </Card>
        </div>

        {currentUser.bio && (
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600">About Me</Label>
              <p className="text-gray-800 mt-2 leading-relaxed">{currentUser.bio}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✏️ Edit Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: UpdateUserInput) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Your full name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: UpdateUserInput) => ({ ...prev, location: e.target.value }))
            }
            placeholder="City, State or Country"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skill_level">Skill Level *</Label>
        <Select
          value={formData.skill_level || ''}
          onValueChange={(value: SkillLevel) =>
            setFormData((prev: UpdateUserInput) => ({ ...prev, skill_level: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your skill level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">🟢 Beginner - New to tennis or learning basics</SelectItem>
            <SelectItem value="intermediate">🟡 Intermediate - Comfortable with rallies and basic strategy</SelectItem>
            <SelectItem value="advanced">🔴 Advanced - Competitive player with strong technique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">About Me (Optional)</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: UpdateUserInput) => ({ 
              ...prev, 
              bio: e.target.value || null 
            }))
          }
          placeholder="Tell others about your tennis journey, preferred playing times, or what you're looking for in a tennis partner..."
          rows={4}
        />
      </div>

      <div className="flex justify-center space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? 'Saving...' : '💾 Save Profile'}
        </Button>
      </div>
    </form>
  );
}
