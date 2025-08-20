import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../../../server/src/schema';

interface ProfileFormProps {
  currentUser: UserProfile;
}

export function ProfileForm({ currentUser }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserProfileInput>({
    name: currentUser.name,
    skill_level: currentUser.skill_level,
    city: currentUser.city,
    state: currentUser.state,
    bio: currentUser.bio
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 🎾 Note: Using update profile API with stub backend
      const updateData: UpdateUserProfileInput = {
        id: currentUser.id,
        ...formData
      };
      
      await trpc.updateUserProfile.mutate(updateData);
      
      // Show success feedback
      alert('🎾 Profile updated successfully! (Note: This is using stub backend data)');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('❌ Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-green-50">
          <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
            <span>🎾</span>
            <span>Your Tennis Profile</span>
          </CardTitle>
          <CardDescription>
            Let other players know what makes you awesome on and off the court!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Current Profile Preview */}
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <span>👤</span>
              <span>Current Profile Preview</span>
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{currentUser.name}</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {currentUser.skill_level}
                    </Badge>
                    <span className="text-sm text-gray-600">📍 {currentUser.city}, {currentUser.state}</span>
                  </div>
                </div>
              </div>
              {currentUser.bio && (
                <p className="text-sm text-gray-600 mt-2 italic">"{currentUser.bio}"</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <span>✨</span>
                <span>Your Name</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Your awesome name"
                className="border-orange-200 focus:border-orange-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <span>🏆</span>
                <span>Skill Level</span>
              </label>
              <Select
                value={formData.skill_level}
                onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, skill_level: value }))
                }
              >
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">🌱 Beginner - Just starting my tennis journey</SelectItem>
                  <SelectItem value="Intermediate">🎯 Intermediate - Getting the hang of it</SelectItem>
                  <SelectItem value="Advanced">🏆 Advanced - Bring on the challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <span>🏙️</span>
                  <span>City</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserProfileInput) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Your city"
                  className="border-orange-200 focus:border-orange-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <span>🗺️</span>
                  <span>State</span>
                </label>
                <Input
                  value={formData.state}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserProfileInput) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="Your state"
                  className="border-orange-200 focus:border-orange-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <span>💬</span>
                <span>Bio</span>
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell us about yourself! What makes you an awesome tennis partner? 🎾"
                className="border-orange-200 focus:border-orange-400 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-400 to-green-400 hover:from-orange-500 hover:to-green-500 text-white font-medium"
            >
              {isLoading ? '⏳ Updating...' : '🎾 Update Profile'}
            </Button>
          </form>

          {/* Stub Notice */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>🛠️ Development Note:</strong> This form uses stub backend data. 
              Profile updates are simulated and won't persist in a real database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
